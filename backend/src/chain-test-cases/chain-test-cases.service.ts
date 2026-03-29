import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChainTestCase } from '../database/entities/chain-test-case.entity';
import { CreateChainTestCaseDto } from './dto/create-chain-test-case.dto';
import { UpdateChainTestCaseDto } from './dto/update-chain-test-case.dto';

@Injectable()
export class ChainTestCasesService {
  constructor(
    @InjectRepository(ChainTestCase)
    private readonly repo: Repository<ChainTestCase>,
  ) {}

  findByChainId(chainId: string): Promise<ChainTestCase[]> {
    return this.repo.find({ where: { chainId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<ChainTestCase> {
    const tc = await this.repo.findOne({ where: { id } });
    if (!tc) throw new NotFoundException(`Chain test case ${id} not found`);
    return tc;
  }

  create(chainId: string, dto: CreateChainTestCaseDto): Promise<ChainTestCase> {
    const tc = this.repo.create({
      chainId,
      variables: JSON.stringify(dto.variables || {}),
    });
    return this.repo.save(tc);
  }

  async update(id: string, dto: UpdateChainTestCaseDto): Promise<ChainTestCase> {
    const tc = await this.findOne(id);
    if (dto.variables !== undefined) {
      tc.variables = JSON.stringify(dto.variables);
    }
    if (dto.output !== undefined) tc.output = dto.output;
    if (dto.thinking !== undefined) tc.thinking = dto.thinking;
    if (dto.evalResult !== undefined) tc.evalResult = dto.evalResult;
    if (dto.status !== undefined) tc.status = dto.status;
    return this.repo.save(tc);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async removeAllByChainId(chainId: string): Promise<void> {
    await this.repo.delete({ chainId });
  }

  async bulkCreate(chainId: string, rows: Record<string, string>[]): Promise<ChainTestCase[]> {
    const entities = rows.map((variables) =>
      this.repo.create({ chainId, variables: JSON.stringify(variables) }),
    );
    return this.repo.save(entities);
  }
}
