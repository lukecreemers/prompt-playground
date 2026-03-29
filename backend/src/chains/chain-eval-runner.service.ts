import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { ChainTestCase } from '../database/entities/chain-test-case.entity';
import pLimit from 'p-limit';

type SendFn = (event: string, data: any) => void;

@Injectable()
export class ChainEvalRunnerService {
  constructor(
    private readonly ai: AiService,
    @InjectRepository(ChainTestCase)
    private readonly tcRepo: Repository<ChainTestCase>,
  ) {}

  async runEvals(
    evalPrompt: string,
    testCases: ChainTestCase[],
    evalConfig: { modelName: string; temperature: number; maxTokens: number; thinkingEnabled?: number | null; thinkingBudget?: number | null },
    concurrencyLimit: number,
    send: SendFn,
    isClosed: () => boolean,
  ): Promise<void> {
    const limit = pLimit(concurrencyLimit || 5);

    const tasks = testCases
      .filter((tc) => tc.output)
      .map((tc) =>
        limit(async () => {
          if (isClosed()) return;

          const variables = JSON.parse(tc.variables || '{}');
          const interpolated = this.interpolateEval(evalPrompt, {
            output: tc.output || '',
            variables: JSON.stringify(variables),
            ...variables,
          });

          const request: LlmRequest = {
            model: evalConfig.modelName,
            prompt: interpolated,
            temperature: evalConfig.temperature,
            maxTokens: evalConfig.maxTokens,
            thinking: evalConfig.thinkingEnabled
              ? { enabled: true, budgetTokens: evalConfig.thinkingBudget || undefined }
              : undefined,
          };

          try {
            send('eval_start', { testCaseId: tc.id });
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
