import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AgentMessage } from './agent-message.entity';
import { AgentVariable } from './agent-variable.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: '' })
  systemPrompt: string;

  @Column({ type: 'text', default: 'claude-sonnet-4-6' })
  modelName: string;

  @Column({ type: 'real', default: 1.0 })
  temperature: number;

  @Column({ type: 'integer', default: 4096 })
  maxTokens: number;

  @Column({ type: 'integer', default: 0 })
  thinkingEnabled: number;

  @Column({ type: 'integer', nullable: true })
  thinkingBudget: number | null;

  @Column({ type: 'text', nullable: true })
  toolsConfig: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AgentMessage, (m) => m.agent, { cascade: true })
  messages: AgentMessage[];

  @OneToMany(() => AgentVariable, (v) => v.agent, { cascade: true })
  variables: AgentVariable[];
}
