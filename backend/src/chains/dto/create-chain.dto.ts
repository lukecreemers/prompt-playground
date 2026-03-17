import { IsString, IsOptional } from 'class-validator';

export class CreateChainDto {
  @IsOptional()
  @IsString()
  name?: string;
}
