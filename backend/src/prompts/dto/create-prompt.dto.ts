import { IsString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreatePromptDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  evalPrompt?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @IsInt()
  thinkingEnabled?: number;

  @IsOptional()
  @IsInt()
  thinkingBudget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  concurrencyLimit?: number;
}
