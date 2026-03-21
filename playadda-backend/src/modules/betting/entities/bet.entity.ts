import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { MatchEntity } from '../../odds/entities/match.entity';
import { OddsEntity } from '../../odds/entities/odds.entity';
import { MarketType } from '../../odds/entities/odds.entity';

export enum BetType {
  BACK = 'BACK',
  LAY = 'LAY',
}

export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  VOID = 'VOID',
}

@Entity('bets')
@Index(['user_id'])
@Index(['match_id'])
@Index(['status'])
@Index(['created_at'])
@Index(['user_id', 'status'])
export class BetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  match_id: string;

  @Column({ type: 'uuid' })
  odds_id: string;

  @Column({ type: 'enum', enum: MarketType })
  market_type: MarketType;

  @Column({ type: 'enum', enum: BetType })
  bet_type: BetType;

  /** Odds price locked at bet placement time */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  odds_price: string;

  /** User's stake amount */
  @Column({ type: 'numeric', precision: 20, scale: 8 })
  stake: string;

  /** Potential payout = stake * odds_price (for BACK bet) */
  @Column({ type: 'numeric', precision: 20, scale: 8 })
  potential_payout: string;

  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.PENDING })
  status: BetStatus;

  @Column({ type: 'timestamptz', nullable: true })
  settled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  settlement_note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.bets)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => MatchEntity, (match) => match.bets)
  @JoinColumn({ name: 'match_id' })
  match: MatchEntity;

  @ManyToOne(() => OddsEntity, (odds) => odds.bets)
  @JoinColumn({ name: 'odds_id' })
  odds: OddsEntity;
}
