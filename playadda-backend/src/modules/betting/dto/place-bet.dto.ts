import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BetType } from '../entities/bet.entity';

export class PlaceBetDto {
  @ApiProperty({ example: 'a3b8d1b6-0b3b-4b1a-9c1a-1a2b3c4d5e6f', description: 'UUID of the match' })
  @IsUUID()
  match_id: string;

  @ApiProperty({ example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', description: 'UUID of the odds market' })
  @IsUUID()
  odds_id: string;

  @ApiProperty({ enum: BetType, example: BetType.BACK, description: 'BACK = buy, LAY = sell' })
  @IsEnum(BetType, { message: 'bet_type must be BACK or LAY' })
  bet_type: BetType;

  @ApiProperty({ example: 500, description: 'Stake amount (minimum 10)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10, { message: 'Minimum stake is 10' })
  @Type(() => Number)
  stake: number;
}
