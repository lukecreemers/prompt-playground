import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptTesterVariable } from '../database/entities/prompt-tester-variable.entity';
import { VariableDto } from './dto/bulk-upsert-variables.dto';

@Injectable()
export class VariablesService {
  constructor(
    @InjectRepository(PromptTesterVariable)
    private readonly repo: Repository<PromptTesterVariable>,
  ) {}

  findByPromptId(promptId: string): Promise<PromptTesterVariable[]> {
    return this.repo.find({ where: { promptId }, order: { key: 'ASC' } });
  }

  async bulkUpsert(promptId: string, variables: VariableDto[]): Promise<PromptTesterVariable[]> {
    // Delete existing variables for this prompt
    await this.repo.delete({ promptId });

    if (variables.length === 0) return [];

    // Insert new ones
    const entities = variables.map((v) =>
      this.repo.create({ promptId, key: v.key, value: v.value || '' }),
    );
    return this.repo.save(entities);
  }

  async removeByKeys(promptId: string, keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.repo.delete({ promptId, key });
    }
  }
}
