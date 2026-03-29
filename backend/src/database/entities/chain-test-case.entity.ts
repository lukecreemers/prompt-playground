import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Chain } from './chain.entity';

@Entity('chain_test_cases')
export class ChainTestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  chainId: string;

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

  @Column({ type: 'integer', nullable: true })
  durationMs: number | null;

  @Column({ type: 'real', nullable: true })
  cost: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Chain, (c) => c.testCases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chainId' })
  chain: Chain;
}
