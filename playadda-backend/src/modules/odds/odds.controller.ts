import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OddsService } from './odds.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Odds')
@Controller('odds')
@Public()
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get all currently LIVE matches with their odds', description: 'No authentication required. Used for public betting dashboard.' })
  @ApiResponse({ status: 200, description: 'Array of live matches with nested odds data' })
  getLiveMatches() {
    return this.oddsService.getLiveMatches();
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get all odds markets for a specific match' })
  @ApiParam({ name: 'matchId', description: 'UUID of the match' })
  @ApiResponse({ status: 200, description: 'Array of odds objects for the match' })
  @ApiResponse({ status: 404, description: 'No odds found for match' })
  getMatchOdds(@Param('matchId') matchId: string) {
    return this.oddsService.getMatchOdds(matchId);
  }
}
