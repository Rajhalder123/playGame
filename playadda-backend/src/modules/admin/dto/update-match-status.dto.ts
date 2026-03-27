import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '../../odds/entities/match.entity';

export class UpdateMatchStatusDto {
  @ApiProperty({ enum: MatchStatus, example: MatchStatus.LIVE, description: 'New match status' })
  @IsEnum(MatchStatus)
  status: MatchStatus;

  @ApiPropertyOptional({ example: 'Mumbai Indians won by 5 wickets', description: 'Result description (for SETTLED status)' })
  @IsString()
  @IsOptional()
  result_note?: string;

  @ApiPropertyOptional({ example: 'Mumbai Indians', description: 'Winning team (used for bulk bet settlement)' })
  @IsString()
  @IsOptional()
  winner?: string;
}
