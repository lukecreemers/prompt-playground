import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeFunction } from '../database/entities/code-function.entity';
import { CreateCodeFunctionDto } from './dto/create-code-function.dto';
import { UpdateCodeFunctionDto } from './dto/update-code-function.dto';

@Injectable()
export class CodeFunctionsService {
  constructor(
    @InjectRepository(CodeFunction)
    private readonly repo: Repository<CodeFunction>,
  ) {}

  findAll(): Promise<CodeFunction[]> {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<CodeFunction> {
    const fn = await this.repo.findOne({ where: { id } });
    if (!fn) throw new NotFoundException(`CodeFunction ${id} not found`);
    return fn;
  }

  create(dto: CreateCodeFunctionDto): Promise<CodeFunction> {
    const fn = this.repo.create(dto);
    return this.repo.save(fn);
  }

  async update(id: string, dto: UpdateCodeFunctionDto): Promise<CodeFunction> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
