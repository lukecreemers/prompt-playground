import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { AgentMessage } from '../database/entities/agent-message.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(AgentMessage)
    private readonly msgRepo: Repository<AgentMessage>,
  ) {}

  findAll(): Promise<Agent[]> {
    return this.agentRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepo.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }

  async create(dto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepo.create(dto);
    const saved = await this.agentRepo.save(agent);

    // Create initial empty user message
    await this.msgRepo.save(
      this.msgRepo.create({ agentId: saved.id, role: 'user', content: '', orderIndex: 0 }),
    );

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    await this.findOne(id);
    await this.agentRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.agentRepo.delete(id);
  }

  // Message methods

  getMessages(agentId: string): Promise<AgentMessage[]> {
    return this.msgRepo.find({
      where: { agentId },
      order: { orderIndex: 'ASC' },
    });
  }

  async addMessage(agentId: string, role: 'user' | 'assistant', content: string = ''): Promise<AgentMessage[]> {
    const existing = await this.getMessages(agentId);
    const nextIndex = existing.length > 0 ? Math.max(...existing.map((m) => m.orderIndex)) + 1 : 0;

    await this.msgRepo.save(
      this.msgRepo.create({ agentId, role, content, orderIndex: nextIndex }),
    );

    await this.agentRepo.update(agentId, {});
    return this.getMessages(agentId);
  }

  async addMessagePair(agentId: string, assistantContent?: string): Promise<AgentMessage[]> {
    const existing = await this.getMessages(agentId);
    const nextIndex = existing.length > 0 ? Math.max(...existing.map((m) => m.orderIndex)) + 1 : 0;

    await this.msgRepo.save(
      this.msgRepo.create({
        agentId,
        role: 'assistant',
        content: assistantContent || '',
        orderIndex: nextIndex,
      }),
    );
    await this.msgRepo.save(
      this.msgRepo.create({
        agentId,
        role: 'user',
        content: '',
        orderIndex: nextIndex + 1,
      }),
    );

    // Touch the agent's updatedAt
    await this.agentRepo.update(agentId, {});

    return this.getMessages(agentId);
  }

  async updateMessage(messageId: string, content: string): Promise<AgentMessage> {
    const msg = await this.msgRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException(`Message ${messageId} not found`);
    msg.content = content;
    await this.msgRepo.save(msg);

    // Touch the agent's updatedAt
    await this.agentRepo.update(msg.agentId, {});

    return msg;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const msg = await this.msgRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException(`Message ${messageId} not found`);

    const agentId = msg.agentId;
    await this.msgRepo.delete(messageId);

    // Reindex remaining messages
    const remaining = await this.getMessages(agentId);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        remaining[i].orderIndex = i;
        await this.msgRepo.save(remaining[i]);
      }
    }
  }

  async deleteMessagesFrom(agentId: string, orderIndex: number): Promise<void> {
    await this.msgRepo.delete({
      agentId,
      orderIndex: MoreThanOrEqual(orderIndex),
    });
  }
}
