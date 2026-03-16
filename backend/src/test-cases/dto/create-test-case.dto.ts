import { IsOptional, IsObject } from 'class-validator';

export class CreateTestCaseDto {
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
