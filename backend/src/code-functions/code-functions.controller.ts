import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CodeFunctionsService } from './code-functions.service';
import { CodeExecutionService } from './code-execution.service';
import { CreateCodeFunctionDto } from './dto/create-code-function.dto';
import { UpdateCodeFunctionDto } from './dto/update-code-function.dto';

@Controller('code-functions')
export class CodeFunctionsController {
  constructor(
    private readonly service: CodeFunctionsService,
    private readonly executor: CodeExecutionService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCodeFunctionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCodeFunctionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/test')
  async test(@Param('id') id: string, @Body() body: { inputs: Record<string, string> }) {
    const fn = await this.service.findOne(id);
    const expectedOutputs: string[] = JSON.parse(fn.outputs || '[]');
    try {
      const outputs = await this.executor.execute(fn.code, body.inputs || {}, expectedOutputs);
      return { outputs };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
