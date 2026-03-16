import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from '../database/entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly repo: Repository<Prompt>,
  ) {}

  findAll(): Promise<Prompt[]> {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Prompt> {
    const prompt = await this.repo.findOne({ where: { id } });
    if (!prompt) throw new NotFoundException(`Prompt ${id} not found`);
    return prompt;
  }

  create(dto: CreatePromptDto): Promise<Prompt> {
    const prompt = this.repo.create(dto);
    return this.repo.save(prompt);
  }

  async update(id: string, dto: UpdatePromptDto): Promise<Prompt> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
