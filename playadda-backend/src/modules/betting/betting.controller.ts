import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BettingService } from './betting.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';

@Controller('bets')
export class BettingController {
  constructor(private readonly bettingService: BettingService) {}

  @Post('place')
  placeBet(@CurrentUser() user: UserEntity, @Body() dto: PlaceBetDto) {
    return this.bettingService.placeBet(user.id, dto);
  }

  @Get('history')
  getBetHistory(
    @CurrentUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bettingService.getBetHistory(user.id, +page, +limit);
  }
}
