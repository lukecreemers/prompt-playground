import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chain } from '../database/entities/chain.entity';
import { ChainNode } from '../database/entities/chain-node.entity';
import { ChainEdge } from '../database/entities/chain-edge.entity';
import { ChainsController } from './chains.controller';
import { ChainsService } from './chains.service';
import { ChainExecutorService } from './chain-executor.service';
import { ChainBatchRunnerService } from './chain-batch-runner.service';
import { ChainEvalRunnerService } from './chain-eval-runner.service';
import { AiModule } from '../ai/ai.module';
import { PromptsModule } from '../prompts/prompts.module';
import { CodeFunctionsModule } from '../code-functions/code-functions.module';
import { ChainTestCasesModule } from '../chain-test-cases/chain-test-cases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chain, ChainNode, ChainEdge]),
    AiModule,
    PromptsModule,
    CodeFunctionsModule,
    ChainTestCasesModule,
  ],
  controllers: [ChainsController],
  providers: [ChainsService, ChainExecutorService, ChainBatchRunnerService, ChainEvalRunnerService],
})
export class ChainsModule {}
