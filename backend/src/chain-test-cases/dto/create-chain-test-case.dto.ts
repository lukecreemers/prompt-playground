import { IsOptional, IsObject } from 'class-validator';

export class CreateChainTestCaseDto {
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
