import { IsOptional, IsObject, IsString } from 'class-validator';

export class UpdateTestCaseDto {
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsString()
  thinking?: string;

  @IsOptional()
  @IsString()
  evalResult?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
