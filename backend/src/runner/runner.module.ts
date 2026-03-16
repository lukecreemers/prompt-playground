import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestCase } from '../database/entities/test-case.entity';
import { RunnerController } from './runner.controller';
import { RunnerService } from './runner.service';
import { BatchRunnerService } from './batch-runner.service';
import { EvalRunnerService } from './eval-runner.service';
import { AiModule } from '../ai/ai.module';
import { PromptsModule } from '../prompts/prompts.module';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { VariablesModule } from '../variables/variables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestCase]),
    AiModule,
    PromptsModule,
    TestCasesModule,
    VariablesModule,
  ],
  controllers: [RunnerController],
  providers: [RunnerService, BatchRunnerService, EvalRunnerService],
})
export class RunnerModule {}
