import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../database/entities/agent.entity';
import { AgentMessage } from '../database/entities/agent-message.entity';
import { AgentVariable } from '../database/entities/agent-variable.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentSyncVariablesService } from './agent-sync-variables.service';
import { AiModule } from '../ai/ai.module';
import { RunnerModule } from '../runner/runner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentMessage, AgentVariable]),
    AiModule,
    RunnerModule,
  ],
  controllers: [AgentsController],
  providers: [AgentsService, AgentSyncVariablesService],
  exports: [AgentsService],
})
export class AgentsModule {}
