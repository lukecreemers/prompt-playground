import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTesterVariable } from '../database/entities/prompt-tester-variable.entity';
import { VariablesController } from './variables.controller';
import { VariablesService } from './variables.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromptTesterVariable])],
  controllers: [VariablesController],
  providers: [VariablesService],
  exports: [VariablesService],
})
export class VariablesModule {}
