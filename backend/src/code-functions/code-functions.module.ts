import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeFunction } from '../database/entities/code-function.entity';
import { CodeFunctionsController } from './code-functions.controller';
import { CodeFunctionsService } from './code-functions.service';
import { CodeExecutionService } from './code-execution.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([CodeFunction]), AiModule],
  controllers: [CodeFunctionsController],
  providers: [CodeFunctionsService, CodeExecutionService],
  exports: [CodeFunctionsService, CodeExecutionService],
})
export class CodeFunctionsModule {}
