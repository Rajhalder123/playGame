import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BettingService } from './betting.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';

@ApiTags('Bets')
@ApiBearerAuth('JWT')
@Controller('bets')
export class BettingController {
  constructor(private readonly bettingService: BettingService) {}

  @Post('place')
  @ApiOperation({
    summary: 'Place a bet',
    description: `Places a bet on a live/upcoming match market.
- Validates match is LIVE or UPCOMING
- Validates odds market is not suspended  
- **Locks funds atomically** (SELECT FOR UPDATE) to prevent race conditions
- Calculates potential payout (BACK: stake × odds, LAY: stake × (odds - 1))
- Returns the created bet record`,
  })
  @ApiResponse({ status: 201, description: 'Bet placed. Funds locked. Returns bet record.' })
  @ApiResponse({ status: 400, description: 'Insufficient funds / market suspended / match closed' })
  @ApiResponse({ status: 404, description: 'Match or odds not found' })
  placeBet(@CurrentUser() user: UserEntity, @Body() dto: PlaceBetDto) {
    return this.bettingService.placeBet(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get bet history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated bet history with match and odds relations' })
  getBetHistory(
    @CurrentUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bettingService.getBetHistory(user.id, +page, +limit);
  }
}
