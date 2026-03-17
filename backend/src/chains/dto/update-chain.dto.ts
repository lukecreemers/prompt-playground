import { IsString, IsOptional } from 'class-validator';

export class UpdateChainDto {
  @IsOptional()
  @IsString()
  name?: string;
}
