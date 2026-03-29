import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptsModule } from './prompts/prompts.module';
import { VariablesModule } from './variables/variables.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { RunnerModule } from './runner/runner.module';
import { AiModule } from './ai/ai.module';
import { AgentsModule } from './agents/agents.module';
import { ChainsModule } from './chains/chains.module';
import { ChainTestCasesModule } from './chain-test-cases/chain-test-cases.module';
import { CodeFunctionsModule } from './code-functions/code-functions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/prompts.db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PromptsModule,
    VariablesModule,
    TestCasesModule,
    RunnerModule,
    AiModule,
    AgentsModule,
    ChainsModule,
    ChainTestCasesModule,
    CodeFunctionsModule,
  ],
})
export class AppModule {}
