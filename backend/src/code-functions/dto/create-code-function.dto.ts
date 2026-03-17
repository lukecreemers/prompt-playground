import { IsString, IsOptional } from 'class-validator';

export class CreateCodeFunctionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  inputs?: string;

  @IsOptional()
  @IsString()
  outputs?: string;
}
