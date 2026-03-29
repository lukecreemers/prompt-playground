import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChainTestCasesService } from './chain-test-cases.service';
import { CreateChainTestCaseDto } from './dto/create-chain-test-case.dto';
import { UpdateChainTestCaseDto } from './dto/update-chain-test-case.dto';
import { parse } from 'csv-parse/sync';

@Controller()
export class ChainTestCasesController {
  constructor(private readonly service: ChainTestCasesService) {}

  @Get('chains/:chainId/test-cases')
  findAll(@Param('chainId') chainId: string) {
    return this.service.findByChainId(chainId);
  }

  @Post('chains/:chainId/test-cases')
  create(
    @Param('chainId') chainId: string,
    @Body() dto: CreateChainTestCaseDto,
  ) {
    return this.service.create(chainId, dto);
  }

  @Patch('chain-test-cases/:id')
  update(@Param('id') id: string, @Body() dto: UpdateChainTestCaseDto) {
    return this.service.update(id, dto);
  }

  @Delete('chain-test-cases/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('chains/:chainId/test-cases')
  removeAll(@Param('chainId') chainId: string) {
    return this.service.removeAllByChainId(chainId);
  }

  @Post('chains/:chainId/test-cases/csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @Param('chainId') chainId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    return this.service.bulkCreate(chainId, records);
  }
}
