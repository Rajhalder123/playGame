import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BetEntity, BetStatus, BetType } from './entities/bet.entity';
import { OddsEntity } from '../odds/entities/odds.entity';
import { MatchEntity, MatchStatus } from '../odds/entities/match.entity';
import { WalletService } from '../wallet/wallet.service';
import { PlaceBetDto } from './dto/place-bet.dto';

@Injectable()
export class BettingService {
  constructor(
    @InjectRepository(BetEntity)
    private readonly betRepo: Repository<BetEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async placeBet(userId: string, dto: PlaceBetDto): Promise<BetEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Validate match is LIVE
      const match = await manager.findOne(MatchEntity, { where: { id: dto.match_id } });
      if (!match) throw new NotFoundException('Match not found');
      if (match.status !== MatchStatus.LIVE && match.status !== MatchStatus.UPCOMING) {
        throw new BadRequestException('Betting is closed for this match');
      }

      // 2. Validate odds exist and are not suspended
      const odds = await manager.findOne(OddsEntity, { where: { id: dto.odds_id } });
      if (!odds) throw new NotFoundException('Odds not found');
      if (odds.is_suspended) throw new BadRequestException('This market is suspended');

      // 3. Lock funds in wallet (SELECT FOR UPDATE inside)
      await this.walletService.lockFunds(manager, userId, dto.stake, 'temp');

      // 4. Calculate payout
      const oddsPrice = parseFloat(
        dto.bet_type === BetType.BACK ? odds.back_price : odds.lay_price,
      );
      const potentialPayout =
        dto.bet_type === BetType.BACK ? dto.stake * oddsPrice : dto.stake * (oddsPrice - 1);

      // 5. Create bet record
      const bet = manager.create(BetEntity, {
        user_id: userId,
        match_id: dto.match_id,
        odds_id: dto.odds_id,
        market_type: odds.market_type,
        bet_type: dto.bet_type,
        odds_price: oddsPrice.toFixed(2),
        stake: dto.stake.toFixed(8),
        potential_payout: potentialPayout.toFixed(8),
        status: BetStatus.PENDING,
      });
      const savedBet = await manager.save(bet);

      // 6. Re-lock with the real bet ID for reference tracking
      // Update the BET_LOCK transaction reference_id now that we have bet.id
      await manager.query(
        `UPDATE transactions SET reference_id = $1 WHERE reference_id = 'temp' AND wallet_id = (SELECT id FROM wallets WHERE user_id = $2)`,
        [savedBet.id, userId],
      );

      return savedBet;
    });
  }

  async settleBet(betId: string, win: boolean): Promise<BetEntity> {
    return this.dataSource.transaction(async (manager) => {
      const bet = await manager.findOne(BetEntity, { where: { id: betId } });
      if (!bet) throw new NotFoundException('Bet not found');
      if (bet.status !== BetStatus.PENDING) {
        throw new BadRequestException('Bet is already settled');
      }

      const stake = parseFloat(bet.stake);
      const payout = parseFloat(bet.potential_payout);

      if (win) {
        await this.walletService.settleBetWin(manager, bet.user_id, stake, payout, betId);
        bet.status = BetStatus.WON;
        bet.settlement_note = `Won. Payout: ${payout.toFixed(2)}`;
      } else {
        await this.walletService.settleBetLoss(manager, bet.user_id, stake, betId);
        bet.status = BetStatus.LOST;
        bet.settlement_note = `Lost. Stake: ${stake.toFixed(2)}`;
      }

      bet.settled_at = new Date();
      return manager.save(bet);
    });
  }

  async getBetHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: BetEntity[]; total: number }> {
    const [data, total] = await this.betRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['match', 'odds'],
    });
    return { data, total };
  }
}
