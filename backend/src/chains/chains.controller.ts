import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChainsService } from './chains.service';
import { ChainExecutorService } from './chain-executor.service';
import { ChainBatchRunnerService } from './chain-batch-runner.service';
import { ChainEvalRunnerService } from './chain-eval-runner.service';
import { ChainTestCasesService } from '../chain-test-cases/chain-test-cases.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { SaveChainGraphDto } from './dto/save-chain-graph.dto';

@Controller('chains')
export class ChainsController {
  constructor(
    private readonly chainsService: ChainsService,
    private readonly executor: ChainExecutorService,
    private readonly batchRunner: ChainBatchRunnerService,
    private readonly evalRunner: ChainEvalRunnerService,
    private readonly chainTestCasesService: ChainTestCasesService,
  ) {}

  @Get()
  findAll() {
    return this.chainsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chainsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChainDto) {
    return this.chainsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChainDto) {
    return this.chainsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chainsService.remove(id);
  }

  @Put(':id/graph')
  saveGraph(@Param('id') id: string, @Body() dto: SaveChainGraphDto) {
    return this.chainsService.saveGraph(id, dto);
  }

  @Post(':id/run')
  async run(@Param('id') id: string, @Res() res: Response) {
    const chain = await this.chainsService.findOne(id);

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

    await this.executor.execute(id, chain.nodes, chain.edges, send, () => closed);

    if (!closed) {
      res.end();
    }
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    this.executor.stop(id);
    return { ok: true };
  }

  @Post(':id/run-batch')
  async runBatch(
    @Param('id') id: string,
    @Body() body: { testCaseIds?: string[]; withEval?: boolean },
    @Res() res: Response,
  ) {
    const chain = await this.chainsService.findOne(id);

    let testCases = await this.chainTestCasesService.findByChainId(id);
    if (body.testCaseIds && body.testCaseIds.length > 0) {
      const idSet = new Set(body.testCaseIds);
      testCases = testCases.filter((tc) => idSet.has(tc.id));
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

    await this.batchRunner.runBatch(
      {
        chainId: id,
        nodes: chain.nodes,
        edges: chain.edges,
        testCases,
        concurrencyLimit: chain.concurrencyLimit || 5,
      },
      send,
      () => closed,
    );

    // Run eval if requested
    if (body.withEval && chain.evalPrompt) {
      const updatedCases = await this.chainTestCasesService.findByChainId(id);
      const casesToEval = body.testCaseIds
        ? updatedCases.filter((tc) => body.testCaseIds!.includes(tc.id))
        : updatedCases;

      const evalModelName = chain.evalModelName || 'claude-sonnet-4-20250514';
      await this.evalRunner.runEvals(
        chain.evalPrompt,
        casesToEval,
        {
          modelName: evalModelName,
          temperature: chain.evalTemperature ?? 0,
          maxTokens: chain.evalMaxTokens ?? 4096,
          thinkingEnabled: chain.evalThinkingEnabled,
          thinkingBudget: chain.evalThinkingBudget,
        },
        chain.concurrencyLimit || 5,
        send,
        () => closed,
      );
    }

    if (!closed) {
      send('batch_done', {});
      res.end();
    }
  }

  @Post(':id/run-eval')
  async runEval(
    @Param('id') id: string,
    @Body() body: { testCaseIds?: string[] },
    @Res() res: Response,
  ) {
    const chain = await this.chainsService.findOne(id);
    if (!chain.evalPrompt) {
      res.status(400).json({ message: 'No eval prompt configured' });
      return;
    }

    let testCases = await this.chainTestCasesService.findByChainId(id);
    if (body.testCaseIds && body.testCaseIds.length > 0) {
      const idSet = new Set(body.testCaseIds);
      testCases = testCases.filter((tc) => idSet.has(tc.id));
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

    const evalModelName = chain.evalModelName || 'claude-sonnet-4-20250514';
    await this.evalRunner.runEvals(
      chain.evalPrompt,
      testCases,
      {
        modelName: evalModelName,
        temperature: chain.evalTemperature ?? 0,
        maxTokens: chain.evalMaxTokens ?? 4096,
        thinkingEnabled: chain.evalThinkingEnabled,
        thinkingBudget: chain.evalThinkingBudget,
      },
      chain.concurrencyLimit || 5,
      send,
      () => closed,
    );

    if (!closed) {
      send('eval_done', {});
      res.end();
    }
  }

  @Post(':id/stop-batch')
  stopBatch() {
    this.batchRunner.stopAll();
    return { ok: true };
  }
}
