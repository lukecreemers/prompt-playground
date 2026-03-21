import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { TestCase } from '../database/entities/test-case.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pLimit from 'p-limit';

interface BatchOptions {
  prompt: { content: string; modelName: string; temperature: number; maxTokens: number; thinkingEnabled: number; thinkingBudget: number | null; concurrencyLimit: number };
  testCases: TestCase[];
}

type SendFn = (event: string, data: any) => void;

@Injectable()
export class BatchRunnerService {
  constructor(
    private readonly ai: AiService,
    @InjectRepository(TestCase)
    private readonly tcRepo: Repository<TestCase>,
  ) {}

  async runBatch(options: BatchOptions, send: SendFn, isClosed: () => boolean): Promise<void> {
    const { prompt, testCases } = options;
    const limit = pLimit(prompt.concurrencyLimit || 5);

    send('batch_start', { totalCases: testCases.length });

    const tasks = testCases.map((tc) =>
      limit(async () => {
        if (isClosed()) return;

        const variables = JSON.parse(tc.variables || '{}');
        const interpolated = this.interpolate(prompt.content, variables);

        send('case_start', { testCaseId: tc.id });

        await this.tcRepo.update(tc.id, { status: 'running', output: null, thinking: null, evalResult: null });

        const request: LlmRequest = {
          model: prompt.modelName,
          prompt: interpolated,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
          thinking: prompt.thinkingEnabled
            ? { enabled: true, budgetTokens: prompt.thinkingBudget || undefined }
            : undefined,
        };

        try {
          let fullText = '';
          let fullThinking = '';

          await new Promise<void>((resolve, reject) => {
            this.ai.stream(request).subscribe({
              next: (chunk) => {
                if (isClosed()) return;
                switch (chunk.type) {
                  case 'text_delta':
                    fullText += chunk.content;
                    break;
                  case 'thinking_delta':
                    fullThinking += chunk.content;
                    break;
                  case 'error':
                    reject(new Error(chunk.content));
                    break;
                }
              },
              complete: () => resolve(),
              error: (err) => reject(err),
            });
          });

          await this.tcRepo.update(tc.id, {
            output: fullText,
            thinking: fullThinking || null,
            status: 'completed',
          });

          send('case_done', { testCaseId: tc.id, output: fullText, thinking: fullThinking || null });
        } catch (err: any) {
          await this.tcRepo.update(tc.id, { status: 'failed', output: err.message });
          send('case_error', { testCaseId: tc.id, error: err.message });
        }
      }),
    );

    await Promise.all(tasks);
  }

  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
  }
}
