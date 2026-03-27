import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BettingService } from './betting.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { BetFilterDto } from './dto/bet-filter.dto';
import { BetStatus } from './entities/bet.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';

@ApiTags('Bets')
@ApiBearerAuth('JWT')
@Controller('bets')
export class BettingController {
  constructor(private readonly bettingService: BettingService) {}

  @Post('place')
  @ApiOperation({
    summary: 'Place a bet (BACK or LAY)',
    description: `Atomically locks funds via SELECT FOR UPDATE and creates a PENDING bet.\n- **BACK**: betting the selection wins. Payout = stake × back_price\n- **LAY**: betting the selection loses. Payout = stake × (lay_price - 1)`,
  })
  @ApiResponse({ status: 201, description: 'Bet placed. Funds locked.' })
  @ApiResponse({ status: 400, description: 'Insufficient funds / market suspended / closed match' })
  @ApiResponse({ status: 404, description: 'Match or odds not found' })
  placeBet(@CurrentUser() user: UserEntity, @Body() dto: PlaceBetDto) {
    return this.bettingService.placeBet(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get bet history (paginated, filterable)' })
  @ApiQuery({ name: 'status', enum: BetStatus, required: false, description: 'Filter by bet status' })
  @ApiQuery({ name: 'match_id', required: false, description: 'Filter by match UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated bet history with match + odds data' })
  getBetHistory(
    @CurrentUser() user: UserEntity,
    @Query('status') status?: BetStatus,
    @Query('match_id') match_id?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bettingService.getBetHistory(user.id, { status, match_id, page: +page, limit: +limit });
  }

  @Get(':betId')
  @ApiOperation({ summary: 'Get a single bet by ID (must belong to current user)' })
  @ApiParam({ name: 'betId', description: 'UUID of the bet' })
  @ApiResponse({ status: 200, description: 'Bet details with match + odds' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  getBet(@CurrentUser() user: UserEntity, @Param('betId') betId: string) {
    return this.bettingService.getBetById(betId, user.id);
  }
}
