import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BetType } from '../entities/bet.entity';

export class PlaceBetDto {
  @IsUUID()
  match_id: string;

  @IsUUID()
  odds_id: string;

  @IsEnum(BetType, { message: 'bet_type must be BACK or LAY' })
  bet_type: BetType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10, { message: 'Minimum stake is 10' })
  @Type(() => Number)
  stake: number;
}
