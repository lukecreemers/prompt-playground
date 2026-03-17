import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChainsService } from './chains.service';
import { ChainExecutorService } from './chain-executor.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { SaveChainGraphDto } from './dto/save-chain-graph.dto';

@Controller('chains')
export class ChainsController {
  constructor(
    private readonly chainsService: ChainsService,
    private readonly executor: ChainExecutorService,
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

    await this.executor.execute(chain.nodes, chain.edges, send, () => closed);

    if (!closed) {
      res.end();
    }
  }
}
