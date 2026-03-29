import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainTestCase } from '../database/entities/chain-test-case.entity';
import { ChainTestCasesController } from './chain-test-cases.controller';
import { ChainTestCasesService } from './chain-test-cases.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChainTestCase])],
  controllers: [ChainTestCasesController],
  providers: [ChainTestCasesService],
  exports: [ChainTestCasesService, TypeOrmModule],
})
export class ChainTestCasesModule {}
