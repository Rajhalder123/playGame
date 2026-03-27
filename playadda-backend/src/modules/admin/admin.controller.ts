import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { MatchStatus, SportType } from '../odds/entities/match.entity';
import { BetStatus } from '../betting/entities/bet.entity';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { CreditWalletDto } from './dto/credit-wallet.dto';

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

  @ApiProperty({ example: '2026-04-01T14:30:00.000Z' })
  @IsString()
  scheduled_at: string;
}

class UpdateOddsDto {
  @ApiProperty({ example: 1.85 })
  @IsNumber() @Min(1.01) @Type(() => Number)
  back_price: number;

  @ApiProperty({ example: 1.90 })
  @IsNumber() @Min(1.01) @Type(() => Number)
  lay_price: number;

  @ApiPropertyOptional({ example: 75000 })
  @IsNumber() @IsOptional() @Min(0) @Type(() => Number)
  liquidity?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean() @IsOptional()
  is_suspended?: boolean;
}

class SettleBetDto {
  @ApiProperty({ example: true, description: 'true = WON, false = LOST' })
  @IsBoolean()
  won: boolean;
}

class VoidBetDto {
  @ApiProperty({ example: 'Market integrity issue' })
  @IsString()
  reason: string;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform statistics dashboard' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ── Match Management ──────────────────────────────────────
  @Get('matches')
  @ApiOperation({ summary: 'List all matches (optional status filter)' })
  @ApiQuery({ name: 'status', enum: MatchStatus, required: false })
  getAllMatches(@Query('status') status?: MatchStatus) {
    return this.adminService.getAllMatches(status);
  }

  @Post('matches')
  @ApiOperation({ summary: 'Create a new match + auto MATCH_ODDS market' })
  @ApiResponse({ status: 201, description: 'Match created' })
  createMatch(@Body() dto: CreateMatchDto) {
    return this.adminService.createMatch(dto);
  }

  @Patch('matches/:matchId/status')
  @ApiOperation({
    summary: 'Update match status (UPCOMING → LIVE → SETTLED)',
    description: 'Setting to SETTLED triggers automatic bulk settlement of all pending bets'
  })
  @ApiParam({ name: 'matchId' })
  @ApiResponse({ status: 200, description: 'Status updated. Returns match + number of bets settled.' })
  updateMatchStatus(
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchStatusDto,
  ) {
    return this.adminService.updateMatchStatus(matchId, dto.status, dto.winner, dto.result_note);
  }

  // ── Odds Management ───────────────────────────────────────
  @Put('odds/:oddsId')
  @ApiOperation({ summary: 'Update odds prices (triggers WebSocket broadcast when Redis enabled)' })
  @ApiParam({ name: 'oddsId' })
  updateOdds(@Param('oddsId') oddsId: string, @Body() dto: UpdateOddsDto) {
    return this.adminService.updateOdds(oddsId, dto);
  }

  // ── Bet Management ────────────────────────────────────────
  @Get('bets')
  @ApiOperation({ summary: 'List all bets (admin view, with user/match/odds details)' })
  @ApiQuery({ name: 'match_id', required: false })
  @ApiQuery({ name: 'status', enum: BetStatus, required: false })
  getAllBets(
    @Query('match_id') matchId?: string,
    @Query('status') status?: BetStatus,
  ) {
    return this.adminService.getAllBets(matchId, status);
  }

  @Post('bets/:betId/settle')
  @ApiOperation({ summary: 'Settle a single pending bet as WIN or LOSS' })
  @ApiParam({ name: 'betId' })
  settleBet(@Param('betId') betId: string, @Body() dto: SettleBetDto) {
    return this.adminService.settleBet(betId, dto.won);
  }

  @Post('bets/:betId/void')
  @ApiOperation({ summary: 'Void a pending bet — stake is refunded to user wallet' })
  @ApiParam({ name: 'betId' })
  voidBet(@Param('betId') betId: string, @Body() dto: VoidBetDto) {
    return this.adminService.voidBet(betId, dto.reason);
  }

  // ── User Management ───────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all registered users' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get single user profile by ID' })
  @ApiParam({ name: 'userId' })
  getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Patch('users/:userId/toggle-active')
  @ApiOperation({ summary: 'Enable / disable a user account' })
  @ApiParam({ name: 'userId' })
  toggleUser(@Param('userId') userId: string) {
    return this.adminService.toggleUserActive(userId);
  }

  // ── Wallet Management ─────────────────────────────────────
  @Get('users/:userId/wallet')
  @ApiOperation({ summary: "View any user's wallet balance" })
  @ApiParam({ name: 'userId' })
  getUserWallet(@Param('userId') userId: string) {
    return this.adminService.getUserWallet(userId);
  }

  @Post('users/:userId/wallet/credit')
  @ApiOperation({ summary: 'Manually credit funds to a user wallet (promotional/bonus)' })
  @ApiParam({ name: 'userId' })
  @ApiResponse({ status: 201, description: 'Funds credited. Returns new balance.' })
  creditWallet(@Param('userId') userId: string, @Body() dto: CreditWalletDto) {
    return this.adminService.creditUserWallet(userId, dto.amount, dto.reason);
  }
}
