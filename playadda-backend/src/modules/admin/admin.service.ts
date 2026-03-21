import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEntity, SportType } from '../odds/entities/match.entity';
import { OddsEntity, MarketType } from '../odds/entities/odds.entity';
import { BetEntity } from '../betting/entities/bet.entity';
import { WalletService } from '../wallet/wallet.service';
import { DataSource } from 'typeorm';
import { BetStatus } from '../betting/entities/bet.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(OddsEntity)
    private readonly oddsRepo: Repository<OddsEntity>,
    @InjectRepository(BetEntity)
    private readonly betRepo: Repository<BetEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async createMatch(dto: {
    sport: SportType;
    tournament: string;
    team_a: string;
    team_b: string;
    scheduled_at: string;
  }): Promise<MatchEntity> {
    const match = this.matchRepo.create({
      ...dto,
      scheduled_at: new Date(dto.scheduled_at),
    });
    const saved = await this.matchRepo.save(match);

    // Create default MATCH_ODDS market
    const odds = this.oddsRepo.create({
      match_id: saved.id,
      market_type: MarketType.MATCH_ODDS,
      back_price: '1.90',
      lay_price: '2.10',
      liquidity: '50000',
    });
    await this.oddsRepo.save(odds);

    return saved;
  }

  async updateOdds(
    oddsId: string,
    dto: { back_price: number; lay_price: number; liquidity?: number; is_suspended?: boolean },
  ): Promise<OddsEntity> {
    const odds = await this.oddsRepo.findOne({ where: { id: oddsId } });
    if (!odds) throw new NotFoundException('Odds not found');

    odds.back_price = dto.back_price.toFixed(2);
    odds.lay_price = dto.lay_price.toFixed(2);
    if (dto.liquidity !== undefined) odds.liquidity = dto.liquidity.toFixed(2);
    if (dto.is_suspended !== undefined) odds.is_suspended = dto.is_suspended;

    return this.oddsRepo.save(odds);
  }

  async settleBet(betId: string, won: boolean): Promise<BetEntity> {
    return this.dataSource.transaction(async (manager) => {
      const bet = await manager.findOne(BetEntity, { where: { id: betId } });
      if (!bet) throw new NotFoundException('Bet not found');
      if (bet.status !== BetStatus.PENDING) {
        throw new BadRequestException('Bet is already settled');
      }

      const stake = parseFloat(bet.stake);
      const payout = parseFloat(bet.potential_payout);

      if (won) {
        await this.walletService.settleBetWin(manager, bet.user_id, stake, payout, betId);
        bet.status = BetStatus.WON;
        bet.settlement_note = `Won. Payout: ${payout.toFixed(2)}`;
      } else {
        await this.walletService.settleBetLoss(manager, bet.user_id, stake, betId);
        bet.status = BetStatus.LOST;
        bet.settlement_note = `Lost. Stake forfeited: ${stake.toFixed(2)}`;
      }

      bet.settled_at = new Date();
      return manager.save(bet);
    });
  }
}
