import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WalletEntity } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BET_LOCK = 'BET_LOCK',       // funds locked when bet is placed
  BET_WIN = 'BET_WIN',         // winnings credited after settlement
  BET_LOSS = 'BET_LOSS',       // locked funds deducted after loss
  BET_VOID = 'BET_VOID',       // refund if bet is voided
  REFERRAL_BONUS = 'REFERRAL_BONUS',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('transactions')
@Index(['wallet_id'])
@Index(['type'])
@Index(['created_at'])
@Index(['reference_id'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  wallet_id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'numeric', precision: 20, scale: 8 })
  amount: string;

  /** Balance snapshot BEFORE this transaction applied */
  @Column({ type: 'numeric', precision: 20, scale: 8 })
  balance_before: string;

  /** Balance snapshot AFTER this transaction applied */
  @Column({ type: 'numeric', precision: 20, scale: 8 })
  balance_after: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  status: TransactionStatus;

  /** External reference: bet ID, payment gateway ID, etc. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  reference_id: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @ManyToOne(() => WalletEntity, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;
}
