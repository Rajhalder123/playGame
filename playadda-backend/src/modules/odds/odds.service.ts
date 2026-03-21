import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEntity, MatchStatus } from './entities/match.entity';
import { OddsEntity } from './entities/odds.entity';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class OddsService {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(OddsEntity)
    private readonly oddsRepo: Repository<OddsEntity>,
    private readonly redisService: RedisService,
  ) {}

  async getLiveMatches(): Promise<MatchEntity[]> {
    return this.matchRepo.find({
      where: { status: MatchStatus.LIVE },
      relations: ['odds'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async getMatchOdds(matchId: string): Promise<OddsEntity[]> {
    const odds = await this.oddsRepo.find({
      where: { match_id: matchId },
      order: { market_type: 'ASC' },
    });
    if (!odds.length) throw new NotFoundException('No odds found for this match');
    return odds;
  }

  async updateOdds(
    oddsId: string,
    backPrice: number,
    layPrice: number,
    liquidity?: number,
  ): Promise<OddsEntity> {
    const odds = await this.oddsRepo.findOne({ where: { id: oddsId } });
    if (!odds) throw new NotFoundException('Odds not found');

    odds.back_price = backPrice.toFixed(2);
    odds.lay_price = layPrice.toFixed(2);
    if (liquidity !== undefined) odds.liquidity = liquidity.toFixed(2);

    const saved = await this.oddsRepo.save(odds);

    // Publish to Redis for WebSocket broadcast
    await this.redisService.publish(
      `odds:${odds.match_id}`,
      JSON.stringify({
        event: 'odds:update',
        matchId: odds.match_id,
        oddsId: saved.id,
        marketType: saved.market_type,
        backPrice: saved.back_price,
        layPrice: saved.lay_price,
        liquidity: saved.liquidity,
        updatedAt: saved.updated_at,
      }),
    );

    return saved;
  }
}
