import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('wallets')
@Index(['user_id'], { unique: true })
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  /**
   * Available balance — what the user can actually use to bet.
   * Available = balance - locked_balance
   * Stored as NUMERIC(20,8) to avoid floating-point issues.
   */
  @Column({ type: 'numeric', precision: 20, scale: 8, default: '0' })
  balance: string;

  /**
   * Amount locked in pending/open bets.
   * This is NOT deducted from balance until settlement.
   * Prevents double-spending during concurrent requests.
   */
  @Column({ type: 'numeric', precision: 20, scale: 8, default: '0' })
  locked_balance: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToOne(() => UserEntity, (user) => user.wallet)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => TransactionEntity, (tx) => tx.wallet, { eager: false })
  transactions: TransactionEntity[];

  /**
   * Computed helper: available balance without DB query
   */
  get available_balance(): number {
    return parseFloat(this.balance) - parseFloat(this.locked_balance);
  }
}
