import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from '../database/entities/prompt.entity';
import { PromptTesterVariable } from '../database/entities/prompt-tester-variable.entity';
import { TestCase } from '../database/entities/test-case.entity';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { SyncVariablesService } from './sync-variables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt, PromptTesterVariable, TestCase])],
  controllers: [PromptsController],
  providers: [PromptsService, SyncVariablesService],
  exports: [PromptsService],
})
export class PromptsModule {}
