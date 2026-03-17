import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { AgentMessage } from '../database/entities/agent-message.entity';
import { AgentVariable } from '../database/entities/agent-variable.entity';

@Injectable()
export class AgentSyncVariablesService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(AgentMessage)
    private readonly msgRepo: Repository<AgentMessage>,
    @InjectRepository(AgentVariable)
    private readonly varRepo: Repository<AgentVariable>,
  ) {}

  async sync(agentId: string): Promise<{ detectedVariables: string[] }> {
    const agent = await this.agentRepo.findOne({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');

    const messages = await this.msgRepo.find({ where: { agentId } });

    // Extract variable names from system prompt + all messages
    const regex = /\{\{(\w+)\}\}/g;
    const detected = new Set<string>();
    let match: RegExpExecArray | null;

    // Scan system prompt
    while ((match = regex.exec(agent.systemPrompt)) !== null) {
      detected.add(match[1]);
    }

    // Scan all message contents
    for (const msg of messages) {
      regex.lastIndex = 0;
      while ((match = regex.exec(msg.content)) !== null) {
        detected.add(match[1]);
      }
    }

    const detectedArr = Array.from(detected);

    // Get current variables
    const currentVars = await this.varRepo.find({ where: { agentId } });
    const currentKeys = currentVars.map((v) => v.key);

    // Remove stale variables
    const staleKeys = currentKeys.filter((k) => !detected.has(k));
    for (const key of staleKeys) {
      await this.varRepo.delete({ agentId, key });
    }

    // Add new variables
    const newKeys = detectedArr.filter((k) => !currentKeys.includes(k));
    for (const key of newKeys) {
      await this.varRepo.save(this.varRepo.create({ agentId, key, value: '' }));
    }

    return { detectedVariables: detectedArr };
  }
}
