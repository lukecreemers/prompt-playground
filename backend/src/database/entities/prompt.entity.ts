import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PromptTesterVariable } from './prompt-tester-variable.entity';
import { TestCase } from './test-case.entity';

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  evalPrompt: string | null;

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
  evalModelName: string | null;

  @Column({ type: 'real', nullable: true })
  evalTemperature: number | null;

  @Column({ type: 'integer', nullable: true })
  evalMaxTokens: number | null;

  @Column({ type: 'integer', nullable: true })
  evalThinkingEnabled: number | null;

  @Column({ type: 'integer', nullable: true })
  evalThinkingBudget: number | null;

  @Column({ type: 'integer', default: 5 })
  concurrencyLimit: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PromptTesterVariable, (v) => v.prompt, { cascade: true })
  variables: PromptTesterVariable[];

  @OneToMany(() => TestCase, (tc) => tc.prompt, { cascade: true })
  testCases: TestCase[];
}
