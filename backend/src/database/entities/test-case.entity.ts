import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Prompt } from './prompt.entity';

@Entity('test_cases')
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  promptId: string;

  @Column({ type: 'text', default: '{}' })
  variables: string;

  @Column({ type: 'text', nullable: true })
  output: string | null;

  @Column({ type: 'text', nullable: true })
  thinking: string | null;

  @Column({ type: 'text', nullable: true })
  evalResult: string | null;

  @Column({ type: 'text', default: 'idle' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Prompt, (p) => p.testCases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;
}
