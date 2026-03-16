import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestCase } from '../database/entities/test-case.entity';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@Injectable()
export class TestCasesService {
  constructor(
    @InjectRepository(TestCase)
    private readonly repo: Repository<TestCase>,
  ) {}

  findByPromptId(promptId: string): Promise<TestCase[]> {
    return this.repo.find({ where: { promptId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<TestCase> {
    const tc = await this.repo.findOne({ where: { id } });
    if (!tc) throw new NotFoundException(`Test case ${id} not found`);
    return tc;
  }

  create(promptId: string, dto: CreateTestCaseDto): Promise<TestCase> {
    const tc = this.repo.create({
      promptId,
      variables: JSON.stringify(dto.variables || {}),
    });
    return this.repo.save(tc);
  }

  async update(id: string, dto: UpdateTestCaseDto): Promise<TestCase> {
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

  async removeAllByPromptId(promptId: string): Promise<void> {
    await this.repo.delete({ promptId });
  }

  async bulkCreate(promptId: string, rows: Record<string, string>[]): Promise<TestCase[]> {
    const entities = rows.map((variables) =>
      this.repo.create({ promptId, variables: JSON.stringify(variables) }),
    );
    return this.repo.save(entities);
  }

  async removeVariableKey(promptId: string, key: string): Promise<void> {
    const cases = await this.findByPromptId(promptId);
    for (const tc of cases) {
      const vars = JSON.parse(tc.variables || '{}');
      delete vars[key];
      tc.variables = JSON.stringify(vars);
      await this.repo.save(tc);
    }
  }
}
