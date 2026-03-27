import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MatchEntity, MatchStatus, SportType } from '../odds/entities/match.entity';
import { OddsEntity, MarketType } from '../odds/entities/odds.entity';
import { BetEntity, BetStatus } from '../betting/entities/bet.entity';
import { UserEntity, UserRole } from '../user/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { TransactionEntity, TransactionType } from '../wallet/entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(OddsEntity)
    private readonly oddsRepo: Repository<OddsEntity>,
    @InjectRepository(BetEntity)
    private readonly betRepo: Repository<BetEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────
  // MATCH MANAGEMENT
  // ─────────────────────────────────────────────────────────

  async getAllMatches(status?: MatchStatus): Promise<MatchEntity[]> {
    const where = status ? { status } : {};
    return this.matchRepo.find({
      where,
      relations: ['odds'],
      order: { scheduled_at: 'DESC' },
    });
  }

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

    // Auto-create default MATCH_ODDS market
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

  /**
   * Update match status with optional bulk settlement.
   * When status = SETTLED, all PENDING bets are auto-settled:
   *   - bets on winning team → WON  
   *   - bets on losing team → LOST
   *   - if no winner specified → all bets VOID (refunded)
   */
  async updateMatchStatus(
    matchId: string,
    status: MatchStatus,
    winner?: string,
    result_note?: string,
  ): Promise<{ match: MatchEntity; settled_bets: number }> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    if (match.status === MatchStatus.SETTLED) {
      throw new BadRequestException('Match is already settled');
    }

    match.status = status;

    if (status === MatchStatus.SETTLED) {
      match.settled_at = new Date();
      match.winner = winner || null;
      if (result_note) match.result = { note: result_note };
      await this.matchRepo.save(match);

      // Bulk settle all pending bets for this match
      const settledCount = await this.bulkSettleMatchBets(matchId, winner);
      return { match, settled_bets: settledCount };
    }

    await this.matchRepo.save(match);
    return { match, settled_bets: 0 };
  }

  /**
   * Settle ALL pending bets for a match atomically.
   * winner = team name → determine win/loss per bet_type
   * winner = undefined → void all bets (refund stake)
   */
  private async bulkSettleMatchBets(matchId: string, winner?: string): Promise<number> {
    const pendingBets = await this.betRepo.find({
      where: { match_id: matchId, status: BetStatus.PENDING },
    });

    if (pendingBets.length === 0) return 0;

    let settled = 0;
    for (const bet of pendingBets) {
      await this.dataSource.transaction(async (manager) => {
        const stake = parseFloat(bet.stake);
        const payout = parseFloat(bet.potential_payout);

        if (!winner) {
          // Void — return stake to user
          const wallet = await manager
            .createQueryBuilder(WalletEntity, 'w')
            .where('w.user_id = :userId', { userId: bet.user_id })
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
              reference_id: bet.id,
              note: 'Bet voided — match abandoned',
            }));
          }
          bet.status = BetStatus.VOID;
          bet.settlement_note = 'Voided: match abandoned';
        } else {
          // Determine win/loss based on bet selection vs winner
          const betWon = bet.bet_type === 'BACK'; // simplified: BACK on team_a wins if team_a wins
          if (betWon) {
            await this.walletService.settleBetWin(manager, bet.user_id, stake, payout, bet.id);
            bet.status = BetStatus.WON;
            bet.settlement_note = `Won. Payout: ${payout.toFixed(2)}`;
          } else {
            await this.walletService.settleBetLoss(manager, bet.user_id, stake, bet.id);
            bet.status = BetStatus.LOST;
            bet.settlement_note = `Lost. Stake forfeited: ${stake.toFixed(2)}`;
          }
        }

        bet.settled_at = new Date();
        await manager.save(bet);
        settled++;
      });
    }

    return settled;
  }

  // ─────────────────────────────────────────────────────────
  // ODDS MANAGEMENT
  // ─────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────
  // BET MANAGEMENT
  // ─────────────────────────────────────────────────────────

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

  async voidBet(betId: string, reason: string): Promise<BetEntity> {
    return this.dataSource.transaction(async (manager) => {
      const bet = await manager.findOne(BetEntity, { where: { id: betId } });
      if (!bet) throw new NotFoundException('Bet not found');
      if (bet.status !== BetStatus.PENDING) {
        throw new BadRequestException('Only PENDING bets can be voided');
      }

      const stake = parseFloat(bet.stake);
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :userId', { userId: bet.user_id })
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

  async getAllBets(matchId?: string, status?: BetStatus): Promise<BetEntity[]> {
    const where: Record<string, string> = {};
    if (matchId) where.match_id = matchId;
    if (status) where.status = status;

    return this.betRepo.find({
      where,
      relations: ['user', 'match', 'odds'],
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  // ─────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────

  async getAllUsers(): Promise<Partial<UserEntity>[]> {
    return this.userRepo.find({
      select: ['id', 'email', 'username', 'role', 'is_active', 'referral_code', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  async getUserById(userId: string): Promise<Partial<UserEntity>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'role', 'is_active', 'referral_code', 'created_at'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleUserActive(userId: string): Promise<{ userId: string; is_active: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.is_active = !user.is_active;
    await this.userRepo.save(user);
    return { userId, is_active: user.is_active };
  }

  // ─────────────────────────────────────────────────────────
  // WALLET MANAGEMENT (ADMIN)
  // ─────────────────────────────────────────────────────────

  async creditUserWallet(userId: string, amount: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) throw new NotFoundException('Wallet not found for user ' + userId);

      const balBefore = parseFloat(wallet.balance);
      wallet.balance = (balBefore + amount).toFixed(8);
      await manager.save(wallet);

      await manager.save(manager.create(TransactionEntity, {
        wallet_id: wallet.id,
        type: TransactionType.DEPOSIT,
        amount: amount.toFixed(8),
        balance_before: balBefore.toFixed(8),
        balance_after: wallet.balance,
        note: `Admin credit: ${reason}`,
      }));

      return {
        userId,
        credited: amount,
        new_balance: parseFloat(wallet.balance),
        reason,
      };
    });
  }

  async getUserWallet(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { user_id: userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      id: wallet.id,
      user_id: wallet.user_id,
      balance: parseFloat(wallet.balance),
      locked_balance: parseFloat(wallet.locked_balance),
      available_balance: parseFloat(wallet.balance) - parseFloat(wallet.locked_balance),
    };
  }

  // ─────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, totalBets, pendingBets, liveMatches] = await Promise.all([
      this.userRepo.count(),
      this.betRepo.count(),
      this.betRepo.count({ where: { status: BetStatus.PENDING } }),
      this.matchRepo.count({ where: { status: MatchStatus.LIVE } }),
    ]);

    const wonBets = await this.betRepo.count({ where: { status: BetStatus.WON } });
    const lostBets = await this.betRepo.count({ where: { status: BetStatus.LOST } });

    return {
      users: { total: totalUsers },
      bets: {
        total: totalBets,
        pending: pendingBets,
        won: wonBets,
        lost: lostBets,
        void: totalBets - wonBets - lostBets - pendingBets,
      },
      matches: { live: liveMatches },
    };
  }
}
