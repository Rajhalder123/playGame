import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SportType } from '../odds/entities/match.entity';
import { MarketType } from '../odds/entities/odds.entity';

class CreateMatchDto {
  @IsEnum(SportType)
  sport: SportType;

  @IsString()
  tournament: string;

  @IsString()
  team_a: string;

  @IsString()
  team_b: string;

  @IsString()
  scheduled_at: string;
}

class UpdateOddsDto {
  @IsNumber() @Min(1.01) @Type(() => Number)
  back_price: number;

  @IsNumber() @Min(1.01) @Type(() => Number)
  lay_price: number;

  @IsNumber() @IsOptional() @Min(0) @Type(() => Number)
  liquidity?: number;

  @IsBoolean() @IsOptional()
  is_suspended?: boolean;
}

class SettleBetDto {
  @IsBoolean()
  won: boolean;
}

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('matches')
  createMatch(@Body() dto: CreateMatchDto) {
    return this.adminService.createMatch(dto);
  }

  @Put('odds/:oddsId')
  updateOdds(@Param('oddsId') oddsId: string, @Body() dto: UpdateOddsDto) {
    return this.adminService.updateOdds(oddsId, dto);
  }

  @Post('bets/:betId/settle')
  settleBet(@Param('betId') betId: string, @Body() dto: SettleBetDto) {
    return this.adminService.settleBet(betId, dto.won);
  }
}
