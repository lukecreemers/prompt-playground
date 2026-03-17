import { IsArray, IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NodeDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsNumber()
  positionX: number;

  @IsNumber()
  positionY: number;

  @IsOptional()
  @IsString()
  config?: string;
}

class EdgeDto {
  @IsString()
  id: string;

  @IsString()
  sourceNodeId: string;

  @IsString()
  sourceHandle: string;

  @IsString()
  targetNodeId: string;

  @IsString()
  targetHandle: string;
}

export class SaveChainGraphDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeDto)
  nodes: NodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeDto)
  edges: EdgeDto[];
}
