import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptTesterVariable } from '../database/entities/prompt-tester-variable.entity';
import { TestCase } from '../database/entities/test-case.entity';
import { Prompt } from '../database/entities/prompt.entity';

@Injectable()
export class SyncVariablesService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepo: Repository<Prompt>,
    @InjectRepository(PromptTesterVariable)
    private readonly varRepo: Repository<PromptTesterVariable>,
    @InjectRepository(TestCase)
    private readonly tcRepo: Repository<TestCase>,
  ) {}

  async sync(promptId: string): Promise<{ detectedVariables: string[] }> {
    const prompt = await this.promptRepo.findOne({ where: { id: promptId } });
    if (!prompt) throw new Error('Prompt not found');

    // Extract variable names from content
    const regex = /\{\{(\w+)\}\}/g;
    const detected = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(prompt.content)) !== null) {
      detected.add(match[1]);
    }

    const detectedArr = Array.from(detected);

    // Get current tester variables
    const currentVars = await this.varRepo.find({ where: { promptId } });
    const currentKeys = currentVars.map((v) => v.key);

    // Find stale keys (in DB but not in prompt)
    const staleKeys = currentKeys.filter((k) => !detected.has(k));

    // Remove stale tester variables
    for (const key of staleKeys) {
      await this.varRepo.delete({ promptId, key });
    }

    // Add new variables that aren't in DB yet
    const newKeys = detectedArr.filter((k) => !currentKeys.includes(k));
    for (const key of newKeys) {
      await this.varRepo.save(this.varRepo.create({ promptId, key, value: '' }));
    }

    // Remove stale keys from test case JSON
    if (staleKeys.length > 0) {
      const testCases = await this.tcRepo.find({ where: { promptId } });
      for (const tc of testCases) {
        const vars = JSON.parse(tc.variables || '{}');
        let changed = false;
        for (const key of staleKeys) {
          if (key in vars) {
            delete vars[key];
            changed = true;
          }
        }
        if (changed) {
          tc.variables = JSON.stringify(vars);
          await this.tcRepo.save(tc);
        }
      }
    }

    // If no variables remain, delete all test cases
    if (detectedArr.length === 0) {
      await this.tcRepo.delete({ promptId });
    }

    return { detectedVariables: detectedArr };
  }
}
