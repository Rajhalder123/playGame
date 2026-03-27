import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { BetEntity, BetStatus, BetType } from './entities/bet.entity';
import { OddsEntity } from '../odds/entities/odds.entity';
import { MatchEntity, MatchStatus } from '../odds/entities/match.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { TransactionEntity, TransactionType } from '../wallet/entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { BetFilterDto } from './dto/bet-filter.dto';

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
      // 1. Validate match is LIVE or UPCOMING
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

      // 6. Update reference_id on the BET_LOCK transaction now that we have bet.id
      await manager.query(
        `UPDATE transactions SET reference_id = $1 WHERE reference_id = 'temp' AND wallet_id = (SELECT id FROM wallets WHERE user_id = $2)`,
        [savedBet.id, userId],
      );

      return savedBet;
    });
  }

  async getBetById(betId: string, userId: string): Promise<BetEntity> {
    const bet = await this.betRepo.findOne({
      where: { id: betId, user_id: userId },
      relations: ['match', 'odds'],
    });
    if (!bet) throw new NotFoundException('Bet not found');
    return bet;
  }

  async getBetHistory(
    userId: string,
    filter: BetFilterDto,
  ): Promise<{ data: BetEntity[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const where: FindOptionsWhere<BetEntity> = { user_id: userId };
    if (filter.status) where.status = filter.status;
    if (filter.match_id) where.match_id = filter.match_id;

    const [data, total] = await this.betRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['match', 'odds'],
    });
    return { data, total, page, limit };
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
        bet.settlement_note = `Lost. Stake forfeited: ${stake.toFixed(2)}`;
      }

      bet.settled_at = new Date();
      return manager.save(bet);
    });
  }

  async voidBet(betId: string, userId: string, reason: string): Promise<BetEntity> {
    return this.dataSource.transaction(async (manager) => {
      const bet = await manager.findOne(BetEntity, { where: { id: betId, user_id: userId } });
      if (!bet) throw new NotFoundException('Bet not found');
      if (bet.status !== BetStatus.PENDING) {
        throw new BadRequestException('Only PENDING bets can be voided');
      }

      const stake = parseFloat(bet.stake);
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (wallet) {
        const balBefore = parseFloat(wallet.balance);
        wallet.balance = (balBefore + stake).toFixed(8);
        wallet.locked_balance = Math.max(0, parseFloat(wallet.locked_balance) - stake).toFixed(8);
        await manager.save(wallet);

        await manager.save(manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.BET_VOID,
          amount: stake.toFixed(8),
          balance_before: balBefore.toFixed(8),
          balance_after: wallet.balance,
          reference_id: betId,
          note: `Bet voided: ${reason}`,
        }));
      }

      bet.status = BetStatus.VOID;
      bet.settlement_note = `Voided: ${reason}`;
      bet.settled_at = new Date();
      return manager.save(bet);
    });
  }
}
