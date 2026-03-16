import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { VariablesService } from './variables.service';
import { BulkUpsertVariablesDto } from './dto/bulk-upsert-variables.dto';

@Controller('prompts/:promptId/variables')
export class VariablesController {
  constructor(private readonly service: VariablesService) {}

  @Get()
  findAll(@Param('promptId') promptId: string) {
    return this.service.findByPromptId(promptId);
  }

  @Put()
  bulkUpsert(
    @Param('promptId') promptId: string,
    @Body() dto: BulkUpsertVariablesDto,
  ) {
    return this.service.bulkUpsert(promptId, dto.variables);
  }
}
