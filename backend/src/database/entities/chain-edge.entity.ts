import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chain } from './chain.entity';

@Entity('chain_edges')
export class ChainEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  chainId: string;

  @Column({ type: 'text' })
  sourceNodeId: string;

  @Column({ type: 'text' })
  sourceHandle: string;

  @Column({ type: 'text' })
  targetNodeId: string;

  @Column({ type: 'text' })
  targetHandle: string;

  @ManyToOne(() => Chain, (c) => c.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chainId' })
  chain: Chain;
}
