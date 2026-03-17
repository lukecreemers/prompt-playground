import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Chain } from './chain.entity';

@Entity('chain_nodes')
export class ChainNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  chainId: string;

  @Column({ type: 'text' })
  type: string; // 'variable' | 'prompt'

  @Column({ type: 'real', default: 0 })
  positionX: number;

  @Column({ type: 'real', default: 0 })
  positionY: number;

  @Column({ type: 'text', default: '{}' })
  config: string; // JSON blob

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Chain, (c) => c.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chainId' })
  chain: Chain;
}
