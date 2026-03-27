import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CasinoSessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum CasinoProvider {
  DEMO = 'DEMO',
  EVOLUTION = 'EVOLUTION',
  EZUGI = 'EZUGI',
  SUPERNOWA = 'SUPERNOWA',
  BETGAMES = 'BETGAMES',
}

@Entity('casino_sessions')
@Index(['user_id'])
@Index(['session_token'])
@Index(['status'])
export class CasinoSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  session_token: string;

  @Column({ type: 'varchar', length: 150 })
  game_id: string;

  @Column({ type: 'varchar', length: 150 })
  game_name: string;

  @Column({ type: 'enum', enum: CasinoProvider, default: CasinoProvider.DEMO })
  provider: CasinoProvider;

  @Column({ type: 'enum', enum: CasinoSessionStatus, default: CasinoSessionStatus.ACTIVE })
  status: CasinoSessionStatus;

  /** Stake for this round */
  @Column({ type: 'numeric', precision: 20, scale: 8, default: '0' })
  total_wagered: string;

  /** Total amount won/lost in this session (positive = net win) */
  @Column({ type: 'numeric', precision: 20, scale: 8, default: '0' })
  net_result: string;

  /** WIN | LOSS | PUSH — set on settle */
  @Column({ type: 'varchar', length: 10, nullable: true })
  round_result: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
