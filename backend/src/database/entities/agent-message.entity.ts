import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('agent_messages')
export class AgentMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  agentId: string;

  @Column({ type: 'text' })
  role: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'integer' })
  orderIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Agent, (a) => a.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;
}
