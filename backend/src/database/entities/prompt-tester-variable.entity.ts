import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Prompt } from './prompt.entity';

@Entity('prompt_tester_variables')
@Unique(['promptId', 'key'])
export class PromptTesterVariable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  promptId: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text', default: '' })
  value: string;

  @ManyToOne(() => Prompt, (p) => p.variables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;
}
