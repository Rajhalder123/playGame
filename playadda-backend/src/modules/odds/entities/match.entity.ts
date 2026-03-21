import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OddsEntity } from './odds.entity';
import { BetEntity } from '../../betting/entities/bet.entity';

export enum MatchStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  SETTLED = 'SETTLED',
  ABANDONED = 'ABANDONED',
}

export enum SportType {
  CRICKET = 'CRICKET',
  FOOTBALL = 'FOOTBALL',
  TENNIS = 'TENNIS',
  BASKETBALL = 'BASKETBALL',
  KABADDI = 'KABADDI',
  HORSE_RACE = 'HORSE_RACE',
  OTHER = 'OTHER',
}

@Entity('matches')
@Index(['status'])
@Index(['sport'])
@Index(['scheduled_at'])
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SportType, default: SportType.CRICKET })
  sport: SportType;

  @Column({ type: 'varchar', length: 255 })
  tournament: string;

  @Column({ type: 'varchar', length: 150 })
  team_a: string;

  @Column({ type: 'varchar', length: 150 })
  team_b: string;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.UPCOMING })
  status: MatchStatus;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  winner: string | null;

  @Column({ type: 'timestamptz' })
  scheduled_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settled_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => OddsEntity, (odds) => odds.match, { eager: false })
  odds: OddsEntity[];

  @OneToMany(() => BetEntity, (bet) => bet.match, { eager: false })
  bets: BetEntity[];
}
