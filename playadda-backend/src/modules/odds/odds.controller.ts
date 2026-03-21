import { Controller, Get, Param } from '@nestjs/common';
import { OddsService } from './odds.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('odds')
@Public()
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('live')
  getLiveMatches() {
    return this.oddsService.getLiveMatches();
  }

  @Get(':matchId')
  getMatchOdds(@Param('matchId') matchId: string) {
    return this.oddsService.getMatchOdds(matchId);
  }
}
