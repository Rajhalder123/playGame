import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BetStatus } from '../entities/bet.entity';

export class BetFilterDto {
  @ApiPropertyOptional({ enum: BetStatus, description: 'Filter by bet status' })
  @IsEnum(BetStatus)
  @IsOptional()
  status?: BetStatus;

  @ApiPropertyOptional({ description: 'Filter by match ID' })
  @IsUUID()
  @IsOptional()
  match_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;
}
