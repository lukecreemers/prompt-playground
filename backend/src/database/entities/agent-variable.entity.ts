import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('agent_variables')
@Unique(['agentId', 'key'])
export class AgentVariable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  agentId: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text', default: '' })
  value: string;

  @ManyToOne(() => Agent, (a) => a.variables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;
}
