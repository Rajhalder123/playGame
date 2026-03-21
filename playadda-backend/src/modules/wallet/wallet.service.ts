import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity, TransactionType } from './entities/transaction.entity';

export interface WalletSnapshot {
  balance: number;
  locked_balance: number;
  available_balance: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(userId: string): Promise<WalletSnapshot> {
    const wallet = await this.findWalletOrThrow(userId);
    return this.toSnapshot(wallet);
  }

  async deposit(userId: string, amount: number): Promise<WalletSnapshot> {
    if (amount <= 0) throw new BadRequestException('Deposit amount must be positive');

    return this.dataSource.transaction(async (manager) => {
      // Row-level lock to prevent concurrent balance mutations
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = parseFloat(wallet.balance);
      const newBalance = balanceBefore + amount;

      wallet.balance = newBalance.toFixed(8);
      await manager.save(wallet);

      await manager.save(
        manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.DEPOSIT,
          amount: amount.toFixed(8),
          balance_before: balanceBefore.toFixed(8),
          balance_after: newBalance.toFixed(8),
          note: 'Manual deposit',
        }),
      );

      return this.toSnapshot(wallet);
    });
  }

  async withdraw(userId: string, amount: number): Promise<WalletSnapshot> {
    if (amount <= 0) throw new BadRequestException('Withdrawal amount must be positive');

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) throw new NotFoundException('Wallet not found');

      const available = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);
      if (available < amount) {
        throw new BadRequestException(
          `Insufficient funds. Available: ${available.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
        );
      }

      const balanceBefore = parseFloat(wallet.balance);
      const newBalance = balanceBefore - amount;
      wallet.balance = newBalance.toFixed(8);
      await manager.save(wallet);

      await manager.save(
        manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.WITHDRAW,
          amount: amount.toFixed(8),
          balance_before: balanceBefore.toFixed(8),
          balance_after: newBalance.toFixed(8),
          note: 'Manual withdrawal',
        }),
      );

      return this.toSnapshot(wallet);
    });
  }

  /**
   * CRITICAL: Lock funds for a bet (SELECT FOR UPDATE prevents race conditions)
   * Called inside betting transaction — pass the manager for atomicity.
   */
  async lockFunds(
    manager: import('typeorm').EntityManager,
    userId: string,
    amount: number,
    betId: string,
  ): Promise<void> {
    const wallet = await manager
      .createQueryBuilder(WalletEntity, 'w')
      .where('w.user_id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found');

    const available = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);
    if (available < amount) {
      throw new BadRequestException(
        `Insufficient funds. Available: ${available.toFixed(2)}, Required: ${amount.toFixed(2)}`,
      );
    }

    const balanceBefore = parseFloat(wallet.balance);
    wallet.locked_balance = (parseFloat(wallet.locked_balance) + amount).toFixed(8);
    await manager.save(wallet);

    await manager.save(
      manager.create(TransactionEntity, {
        wallet_id: wallet.id,
        type: TransactionType.BET_LOCK,
        amount: amount.toFixed(8),
        balance_before: balanceBefore.toFixed(8),
        balance_after: balanceBefore.toFixed(8), // balance unchanged, only locked increased
        reference_id: betId,
        note: 'Funds locked for bet',
      }),
    );
  }

  /**
   * Settle a WON bet: credit payout, release locked stake
   */
  async settleBetWin(
    manager: import('typeorm').EntityManager,
    userId: string,
    stake: number,
    payout: number,
    betId: string,
  ): Promise<void> {
    const wallet = await manager
      .createQueryBuilder(WalletEntity, 'w')
      .where('w.user_id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = parseFloat(wallet.balance);
    // Add payout and release the locked stake in one go
    wallet.balance = (balanceBefore + payout).toFixed(8);
    wallet.locked_balance = Math.max(0, parseFloat(wallet.locked_balance) - stake).toFixed(8);
    await manager.save(wallet);

    await manager.save(
      manager.create(TransactionEntity, {
        wallet_id: wallet.id,
        type: TransactionType.BET_WIN,
        amount: payout.toFixed(8),
        balance_before: balanceBefore.toFixed(8),
        balance_after: wallet.balance,
        reference_id: betId,
        note: `Bet won — payout: ${payout.toFixed(2)}`,
      }),
    );
  }

  /**
   * Settle a LOST bet: deduct stake from balance, release from locked
   */
  async settleBetLoss(
    manager: import('typeorm').EntityManager,
    userId: string,
    stake: number,
    betId: string,
  ): Promise<void> {
    const wallet = await manager
      .createQueryBuilder(WalletEntity, 'w')
      .where('w.user_id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = parseFloat(wallet.balance);
    wallet.balance = (balanceBefore - stake).toFixed(8);
    wallet.locked_balance = Math.max(0, parseFloat(wallet.locked_balance) - stake).toFixed(8);
    await manager.save(wallet);

    await manager.save(
      manager.create(TransactionEntity, {
        wallet_id: wallet.id,
        type: TransactionType.BET_LOSS,
        amount: stake.toFixed(8),
        balance_before: balanceBefore.toFixed(8),
        balance_after: wallet.balance,
        reference_id: betId,
        note: `Bet lost — stake deducted: ${stake.toFixed(2)}`,
      }),
    );
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: TransactionEntity[]; total: number }> {
    const wallet = await this.findWalletOrThrow(userId);
    const [data, total] = await this.txRepo.findAndCount({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  private async findWalletOrThrow(userId: string): Promise<WalletEntity> {
    const wallet = await this.walletRepo.findOne({ where: { user_id: userId } });
    if (!wallet) throw new NotFoundException('Wallet not found for this user');
    return wallet;
  }

  private toSnapshot(wallet: WalletEntity): WalletSnapshot {
    const balance = parseFloat(wallet.balance);
    const locked = parseFloat(wallet.locked_balance);
    return {
      balance,
      locked_balance: locked,
      available_balance: balance - locked,
    };
  }
}
