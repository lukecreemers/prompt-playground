import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChainNode } from './chain-node.entity';
import { ChainEdge } from './chain-edge.entity';
import { ChainTestCase } from './chain-test-case.entity';

@Entity('chains')
export class Chain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', default: 'Untitled Chain' })
  name: string;

  @Column({ type: 'integer', default: 5 })
  concurrencyLimit: number;

  @Column({ type: 'text', nullable: true })
  evalPrompt: string | null;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChainNode, (n) => n.chain, { cascade: true })
  nodes: ChainNode[];

  @OneToMany(() => ChainEdge, (e) => e.chain, { cascade: true })
  edges: ChainEdge[];

  @OneToMany(() => ChainTestCase, (tc) => tc.chain, { cascade: true })
  testCases: ChainTestCase[];
}
