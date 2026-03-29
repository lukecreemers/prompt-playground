import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateChainDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  concurrencyLimit?: number;

  @IsOptional()
  @IsString()
  evalPrompt?: string | null;

  @IsOptional()
  @IsString()
  evalModelName?: string | null;

  @IsOptional()
  @IsNumber()
  evalTemperature?: number | null;

  @IsOptional()
  @IsNumber()
  evalMaxTokens?: number | null;

  @IsOptional()
  @IsNumber()
  evalThinkingEnabled?: number | null;

  @IsOptional()
  @IsNumber()
  evalThinkingBudget?: number | null;
}
