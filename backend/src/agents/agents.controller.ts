import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AgentsService } from './agents.service';
import { AgentSyncVariablesService } from './agent-sync-variables.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { RunnerService } from '../runner/runner.service';
import { AgentVariable } from '../database/entities/agent-variable.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';

@Controller()
export class AgentsController {
  constructor(
    private readonly service: AgentsService,
    private readonly syncService: AgentSyncVariablesService,
    private readonly runnerService: RunnerService,
    @InjectRepository(AgentVariable)
    private readonly varRepo: Repository<AgentVariable>,
  ) {}

  @Get('agents')
  findAll() {
    return this.service.findAll();
  }

  @Post('agents')
  create(@Body() dto: CreateAgentDto) {
    return this.service.create(dto);
  }

  @Get('agents/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('agents/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.service.update(id, dto);
  }

  @Delete('agents/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // Messages

  @Get('agents/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.service.getMessages(id);
  }

  @Post('agents/:id/messages')
  addMessages(
    @Param('id') id: string,
    @Body() body: { assistantContent?: string; role?: 'user' | 'assistant' },
  ) {
    if (body.role) {
      return this.service.addMessage(id, body.role);
    }
    return this.service.addMessagePair(id, body.assistantContent);
  }

  @Patch('agent-messages/:msgId')
  updateMessage(
    @Param('msgId') msgId: string,
    @Body() body: { content: string },
  ) {
    return this.service.updateMessage(msgId, body.content);
  }

  @Delete('agent-messages/:msgId')
  deleteMessage(@Param('msgId') msgId: string) {
    return this.service.deleteMessage(msgId);
  }

  // Variables

  @Get('agents/:id/variables')
  getVariables(@Param('id') id: string) {
    return this.varRepo.find({ where: { agentId: id } });
  }

  @Put('agents/:id/variables')
  async bulkUpsertVariables(
    @Param('id') id: string,
    @Body() body: { variables: { key: string; value: string }[] },
  ) {
    // Delete all existing
    await this.varRepo.delete({ agentId: id });
    // Insert new
    for (const v of body.variables) {
      await this.varRepo.save(this.varRepo.create({ agentId: id, key: v.key, value: v.value }));
    }
    return this.varRepo.find({ where: { agentId: id } });
  }

  @Post('agents/:id/sync-variables')
  syncVariables(@Param('id') id: string) {
    return this.syncService.sync(id);
  }

  // Run

  @Post('agents/:id/run')
  async run(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const agent = await this.service.findOne(id);
    const messages = await this.service.getMessages(id);
    const variables = await this.varRepo.find({ where: { agentId: id } });

    const varMap: Record<string, string> = {};
    for (const v of variables) {
      varMap[v.key] = v.value;
    }

    const interpolate = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, key) => varMap[key] || '');

    // Interpolate system prompt
    const system = interpolate(agent.systemPrompt);

    // Interpolate and filter messages
    const interpolatedMessages = messages
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: interpolate(m.content) }));

    // Strip trailing empty messages
    while (
      interpolatedMessages.length > 0 &&
      interpolatedMessages[interpolatedMessages.length - 1].content.trim() === ''
    ) {
      interpolatedMessages.pop();
    }

    // Validate: last message must be role 'user'
    if (interpolatedMessages.length === 0) {
      throw new BadRequestException('At least one user message is required');
    }
    if (interpolatedMessages[interpolatedMessages.length - 1].role !== 'user') {
      throw new BadRequestException('Last message must be a user message');
    }

    const request: LlmRequest = {
      model: agent.modelName,
      prompt: '',
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      thinking: agent.thinkingEnabled
        ? { enabled: true, budgetTokens: agent.thinkingBudget || undefined }
        : undefined,
      system,
      messages: interpolatedMessages,
    };

    return this.runnerService.runSingle(request, res);
  }
}
