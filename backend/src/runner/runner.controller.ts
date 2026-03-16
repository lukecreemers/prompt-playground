import { Controller, Post, Get, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { RunnerService } from './runner.service';
import { BatchRunnerService } from './batch-runner.service';
import { EvalRunnerService } from './eval-runner.service';
import { PromptsService } from '../prompts/prompts.service';
import { TestCasesService } from '../test-cases/test-cases.service';
import { VariablesService } from '../variables/variables.service';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';

@Controller()
export class RunnerController {
  constructor(
    private readonly runnerService: RunnerService,
    private readonly batchRunner: BatchRunnerService,
    private readonly evalRunner: EvalRunnerService,
    private readonly promptsService: PromptsService,
    private readonly testCasesService: TestCasesService,
    private readonly variablesService: VariablesService,
    private readonly aiService: AiService,
  ) {}

  @Post('prompts/:id/run')
  async runSingle(
    @Param('id') id: string,
    @Body() body: { variables?: Record<string, string> },
    @Res() res: Response,
  ) {
    const prompt = await this.promptsService.findOne(id);

    let variables = body.variables || {};
    if (!body.variables) {
      const vars = await this.variablesService.findByPromptId(id);
      variables = vars.reduce((acc, v) => ({ ...acc, [v.key]: v.value }), {} as Record<string, string>);
    }

    const interpolated = prompt.content.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] || '',
    );

    const request: LlmRequest = {
      model: prompt.modelName,
      prompt: interpolated,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      thinking: prompt.thinkingEnabled
        ? { enabled: true, budgetTokens: prompt.thinkingBudget || undefined }
        : undefined,
    };

    return this.runnerService.runSingle(request, res);
  }

  @Post('prompts/:id/run-batch')
  async runBatch(
    @Param('id') id: string,
    @Body() body: { testCaseIds?: string[]; withEval?: boolean },
    @Res() res: Response,
  ) {
    const prompt = await this.promptsService.findOne(id);
    let testCases = await this.testCasesService.findByPromptId(id);

    if (body.testCaseIds && body.testCaseIds.length > 0) {
      testCases = testCases.filter((tc) => body.testCaseIds!.includes(tc.id));
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let closed = false;
    res.on('close', () => { closed = true; });

    const send = (event: string, data: any) => {
      if (!closed) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    // Run batch
    await this.batchRunner.runBatch({ prompt, testCases }, send, () => closed);

    // Run evals if requested
    if (body.withEval && prompt.evalPrompt && !closed) {
      const updatedCases = await this.testCasesService.findByPromptId(id);
      const completedCases = updatedCases.filter((tc) =>
        body.testCaseIds ? body.testCaseIds.includes(tc.id) : true,
      );
      const evalConfig = {
        modelName: prompt.evalModelName || prompt.modelName,
        temperature: prompt.evalTemperature ?? 0,
        maxTokens: prompt.evalMaxTokens ?? 2048,
      };
      await this.evalRunner.runEvals(
        prompt.evalPrompt,
        prompt.content,
        completedCases,
        evalConfig,
        prompt.concurrencyLimit,
        res,
        send,
      );
    }

    if (!closed) {
      send('batch_done', { summary: { total: testCases.length } });
      res.end();
    }
  }

  @Get('models')
  getModels() {
    return this.aiService.getModels();
  }
}
