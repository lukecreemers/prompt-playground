import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { parse } from 'csv-parse/sync';

@Controller()
export class TestCasesController {
  constructor(private readonly service: TestCasesService) {}

  @Get('prompts/:promptId/test-cases')
  findAll(@Param('promptId') promptId: string) {
    return this.service.findByPromptId(promptId);
  }

  @Post('prompts/:promptId/test-cases')
  create(
    @Param('promptId') promptId: string,
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.service.create(promptId, dto);
  }

  @Patch('test-cases/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.service.update(id, dto);
  }

  @Delete('test-cases/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('prompts/:promptId/test-cases')
  removeAll(@Param('promptId') promptId: string) {
    return this.service.removeAllByPromptId(promptId);
  }

  @Post('prompts/:promptId/test-cases/csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @Param('promptId') promptId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    return this.service.bulkCreate(promptId, records);
  }
}
