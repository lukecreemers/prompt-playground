import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class VariableDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class BulkUpsertVariablesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  variables: VariableDto[];
}
