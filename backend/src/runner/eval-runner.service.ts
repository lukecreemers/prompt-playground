import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { TestCase } from '../database/entities/test-case.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pLimit from 'p-limit';

@Injectable()
export class EvalRunnerService {
  constructor(
    private readonly ai: AiService,
    @InjectRepository(TestCase)
    private readonly tcRepo: Repository<TestCase>,
  ) {}

  async runEvals(
    evalPrompt: string,
    promptContent: string,
    testCases: TestCase[],
    modelName: string,
    concurrencyLimit: number,
    res: Response,
    send: (event: string, data: any) => void,
  ): Promise<void> {
    const limit = pLimit(concurrencyLimit || 5);

    const tasks = testCases
      .filter((tc) => tc.output)
      .map((tc) =>
        limit(async () => {
          const variables = JSON.parse(tc.variables || '{}');
          const interpolated = this.interpolateEval(evalPrompt, {
            output: tc.output || '',
            prompt: promptContent,
            variables: JSON.stringify(variables),
            ...variables,
          });

          const request: LlmRequest = {
            model: modelName,
            prompt: interpolated,
            temperature: 0,
            maxTokens: 2048,
          };

          try {
            const result = await this.ai.complete(request);
            await this.tcRepo.update(tc.id, { evalResult: result });
            send('case_eval_done', { testCaseId: tc.id, evalResult: result });
          } catch (err: any) {
            send('case_eval_done', { testCaseId: tc.id, evalResult: `Error: ${err.message}` });
          }
        }),
      );

    await Promise.all(tasks);
  }

  private interpolateEval(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  }
}
