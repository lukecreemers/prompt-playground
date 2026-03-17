import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chain } from '../database/entities/chain.entity';
import { ChainNode } from '../database/entities/chain-node.entity';
import { ChainEdge } from '../database/entities/chain-edge.entity';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { SaveChainGraphDto } from './dto/save-chain-graph.dto';

@Injectable()
export class ChainsService {
  constructor(
    @InjectRepository(Chain)
    private readonly chainRepo: Repository<Chain>,
    @InjectRepository(ChainNode)
    private readonly nodeRepo: Repository<ChainNode>,
    @InjectRepository(ChainEdge)
    private readonly edgeRepo: Repository<ChainEdge>,
  ) {}

  findAll(): Promise<Chain[]> {
    return this.chainRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Chain> {
    const chain = await this.chainRepo.findOne({
      where: { id },
      relations: ['nodes', 'edges'],
    });
    if (!chain) throw new NotFoundException(`Chain ${id} not found`);
    return chain;
  }

  create(dto: CreateChainDto): Promise<Chain> {
    const chain = this.chainRepo.create(dto);
    return this.chainRepo.save(chain);
  }

  async update(id: string, dto: UpdateChainDto): Promise<Chain> {
    await this.findOne(id);
    await this.chainRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.chainRepo.delete(id);
  }

  async saveGraph(id: string, dto: SaveChainGraphDto): Promise<Chain> {
    const chain = await this.findOne(id);

    // Delete existing nodes and edges
    await this.edgeRepo.delete({ chainId: id });
    await this.nodeRepo.delete({ chainId: id });

    // Insert new nodes
    if (dto.nodes.length > 0) {
      const nodes = dto.nodes.map((n) =>
        this.nodeRepo.create({
          id: n.id,
          chainId: id,
          type: n.type,
          positionX: n.positionX,
          positionY: n.positionY,
          config: n.config || '{}',
        }),
      );
      await this.nodeRepo.save(nodes);
    }

    // Insert new edges
    if (dto.edges.length > 0) {
      const edges = dto.edges.map((e) =>
        this.edgeRepo.create({
          id: e.id,
          chainId: id,
          sourceNodeId: e.sourceNodeId,
          sourceHandle: e.sourceHandle,
          targetNodeId: e.targetNodeId,
          targetHandle: e.targetHandle,
        }),
      );
      await this.edgeRepo.save(edges);
    }

    // Touch updatedAt
    await this.chainRepo.update(id, {});

    return this.findOne(id);
  }
}
