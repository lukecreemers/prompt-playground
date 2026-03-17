import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChainNode } from './chain-node.entity';
import { ChainEdge } from './chain-edge.entity';

@Entity('chains')
export class Chain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', default: 'Untitled Chain' })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChainNode, (n) => n.chain, { cascade: true })
  nodes: ChainNode[];

  @OneToMany(() => ChainEdge, (e) => e.chain, { cascade: true })
  edges: ChainEdge[];
}
