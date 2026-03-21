import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SportType } from '../odds/entities/match.entity';

class CreateMatchDto {
  @ApiProperty({ enum: SportType, example: SportType.CRICKET })
  @IsEnum(SportType)
  sport: SportType;

  @ApiProperty({ example: 'IPL 2026' })
  @IsString()
  tournament: string;

  @ApiProperty({ example: 'Mumbai Indians' })
  @IsString()
  team_a: string;

  @ApiProperty({ example: 'Chennai Super Kings' })
  @IsString()
  team_b: string;

  @ApiProperty({ example: '2026-04-01T14:30:00.000Z', description: 'ISO 8601 datetime' })
  @IsString()
  scheduled_at: string;
}

class UpdateOddsDto {
  @ApiProperty({ example: 1.85, description: 'Back (buy) price — must be > 1.00' })
  @IsNumber() @Min(1.01) @Type(() => Number)
  back_price: number;

  @ApiProperty({ example: 1.90, description: 'Lay (sell) price — must be > 1.00' })
  @IsNumber() @Min(1.01) @Type(() => Number)
  lay_price: number;

  @ApiPropertyOptional({ example: 50000, description: 'Available liquidity' })
  @IsNumber() @IsOptional() @Min(0) @Type(() => Number)
  liquidity?: number;

  @ApiPropertyOptional({ example: false, description: 'Suspend this market (blocks new bets)' })
  @IsBoolean() @IsOptional()
  is_suspended?: boolean;
}

class SettleBetDto {
  @ApiProperty({ example: true, description: 'true = user WON, false = user LOST' })
  @IsBoolean()
  won: boolean;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('matches')
  @ApiOperation({ summary: 'Create a new match', description: 'Creates match + default MATCH_ODDS market automatically. **ADMIN only.**' })
  @ApiResponse({ status: 201, description: 'Match created with default odds market' })
  createMatch(@Body() dto: CreateMatchDto) {
    return this.adminService.createMatch(dto);
  }

  @Put('odds/:oddsId')
  @ApiOperation({ summary: 'Update odds prices for a market', description: 'Triggers Redis pub/sub → WebSocket broadcast to all subscribed clients. **ADMIN only.**' })
  @ApiParam({ name: 'oddsId', description: 'UUID of the odds record to update' })
  @ApiResponse({ status: 200, description: 'Updated odds. Live broadcast sent via WebSocket.' })
  @ApiResponse({ status: 404, description: 'Odds not found' })
  updateOdds(@Param('oddsId') oddsId: string, @Body() dto: UpdateOddsDto) {
    return this.adminService.updateOdds(oddsId, dto);
  }

  @Post('bets/:betId/settle')
  @ApiOperation({ summary: 'Settle a pending bet', description: 'Win: credits payout to wallet. Loss: deducts stake from wallet. Both release locked_balance. **ADMIN only.**' })
  @ApiParam({ name: 'betId', description: 'UUID of the bet to settle' })
  @ApiResponse({ status: 201, description: 'Bet settled. Wallet updated.' })
  @ApiResponse({ status: 400, description: 'Bet already settled' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  settleBet(@Param('betId') betId: string, @Body() dto: SettleBetDto) {
    return this.adminService.settleBet(betId, dto.won);
  }
}
