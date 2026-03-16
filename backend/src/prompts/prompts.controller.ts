import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { SyncVariablesService } from './sync-variables.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Controller('prompts')
export class PromptsController {
  constructor(
    private readonly service: PromptsService,
    private readonly syncService: SyncVariablesService,
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
  create(@Body() dto: CreatePromptDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromptDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/sync-variables')
  syncVariables(@Param('id') id: string) {
    return this.syncService.sync(id);
  }
}
