import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatchEntity } from './match.entity';
import { BetEntity } from '../../betting/entities/bet.entity';

export enum MarketType {
  MATCH_ODDS = 'MATCH_ODDS',
  OVER_UNDER = 'OVER_UNDER',
  BOTH_TEAMS_SCORE = 'BOTH_TEAMS_SCORE',
  INNINGS_RUNS = 'INNINGS_RUNS',
}

@Entity('odds')
@Index(['match_id'])
@Index(['market_type'])
@Index(['match_id', 'market_type'])
export class OddsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  match_id: string;

  @Column({ type: 'enum', enum: MarketType, default: MarketType.MATCH_ODDS })
  market_type: MarketType;

  /** Back (buy) price */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: '0' })
  back_price: string;

  /** Lay (sell) price */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: '0' })
  lay_price: string;

  /** Available liquidity at this price */
  @Column({ type: 'numeric', precision: 20, scale: 2, default: '0' })
  liquidity: string;

  /** True if market is suspended (no new bets allowed) */
  @Column({ type: 'boolean', default: false })
  is_suspended: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => MatchEntity, (match) => match.odds)
  @JoinColumn({ name: 'match_id' })
  match: MatchEntity;

  @OneToMany(() => BetEntity, (bet) => bet.odds, { eager: false })
  bets: BetEntity[];
}
