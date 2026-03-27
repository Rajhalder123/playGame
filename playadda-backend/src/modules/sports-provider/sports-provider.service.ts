import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../config/redis.service';
import { OddsEntity } from '../odds/entities/odds.entity';
import { MatchEntity, MatchStatus } from '../odds/entities/match.entity';
import WebSocket, { RawData } from 'ws';

/**
 * SportsProviderService
 * ─────────────────────
 * Connects to a real-time odds provider via WebSocket.
 * In DEMO mode (no ODDS_PROVIDER_URL set), it self-generates realistic
 * odds fluctuations every 3–5 seconds for all LIVE matches.
 *
 * Real provider integration: just set ODDS_PROVIDER_URL + ODDS_PROVIDER_TOKEN
 * in your .env — the same downstream logic handles both.
 *
 * Data flow:
 *   Provider WS / Demo Timer
 *     → parseProviderMessage()
 *     → updateOddsInDB()
 *     → Redis PUBLISH 'odds:<matchId>'
 *     → EventsGateway broadcasts 'odds:update' to Socket.IO room
 */
@Injectable()
export class SportsProviderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SportsProviderService.name);
  private ws: WebSocket | null = null;
  private demoInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private isDestroyed = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @InjectRepository(OddsEntity)
    private readonly oddsRepo: Repository<OddsEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
  ) {}

  onModuleInit() {
    const providerUrl = this.configService.get<string>('ODDS_PROVIDER_URL');
    if (providerUrl) {
      this.connectToProvider(providerUrl);
    } else {
      this.logger.warn('ODDS_PROVIDER_URL not set — running in DEMO mode (self-generated odds)');
      this.startDemoMode();
    }
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    this.stopDemoMode();
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }

  // ─────────────────────────────────────────────────────────
  // REAL PROVIDER: WebSocket Connection
  // ─────────────────────────────────────────────────────────

  private connectToProvider(url: string) {
    const token = this.configService.get<string>('ODDS_PROVIDER_TOKEN', '');
    this.logger.log(`Connecting to odds provider: ${url}`);

    this.ws = new WebSocket(url, { headers: { Authorization: `Bearer ${token}` } });

    this.ws.on('open', () => {
      this.logger.log('Odds provider WebSocket connected ✅');
      this.reconnectAttempts = 0;

      // Subscribe to all live sports markets
      this.ws?.send(JSON.stringify({
        action: 'subscribe',
        markets: ['CRICKET', 'FOOTBALL', 'TENNIS', 'BASKETBALL'],
        types: ['MATCH_ODDS', 'OVER_UNDER'],
      }));
    });

    this.ws.on('message', (raw: RawData) => {
      try {
        const data = JSON.parse(raw.toString()) as ProviderOddsMessage;
        void this.handleProviderMessage(data);
      } catch (err) {
        this.logger.error('Failed to parse provider message', err);
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      this.logger.warn(`Provider WS closed: ${code} ${reason.toString()}`);
      this.scheduleReconnect(url);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ws.on('error', (err: any) => {
      this.logger.error(`Provider WS error: ${String(err?.message ?? err)}`);
    });
  }

  private scheduleReconnect(url: string) {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // exponential backoff up to 30s
    this.reconnectAttempts++;
    this.logger.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimeout = setTimeout(() => this.connectToProvider(url), delay);
  }

  /**
   * Parse message from your specific provider.
   * Each provider has its own format — adapt this to match theirs.
   *
   * Betfair format example:
   *   { op: "mcm", mc: [{ id: "1.234567", runners: [...] }] }
   *
   * Sportradar format example:
   *   { event: "odds_change", match_id: "uuid", back: 1.85, lay: 1.90 }
   */
  private async handleProviderMessage(data: ProviderOddsMessage) {
    if (!data.match_id) return;

    await this.updateOddsAndPublish({
      match_id: data.match_id,
      market_type: data.market_type || 'MATCH_ODDS',
      back_price: data.back_price,
      lay_price: data.lay_price,
      is_suspended: data.is_suspended || false,
    });
  }

  // ─────────────────────────────────────────────────────────
  // DEMO MODE: Simulate Live Odds Updates
  // ─────────────────────────────────────────────────────────

  private startDemoMode() {
    this.logger.log('🎲 DEMO MODE: Simulating live odds every 4 seconds');
    this.demoInterval = setInterval(() => void this.simulateDemoOddsUpdate(), 4000);
  }

  private stopDemoMode() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }

  private async simulateDemoOddsUpdate() {
    const liveMatches = await this.matchRepo.find({
      where: { status: MatchStatus.LIVE },
      relations: ['odds'],
      take: 10,
    });

    if (liveMatches.length === 0) return;

    // Pick a random live match
    const match = liveMatches[Math.floor(Math.random() * liveMatches.length)];
    const odds = match.odds?.[0];
    if (!odds) return;

    // Simulate realistic odds movement (±0.01 to ±0.05)
    const currentBack = parseFloat(odds.back_price);
    const drift = (Math.random() - 0.5) * 0.06; // -0.03 to +0.03
    const newBack = Math.max(1.01, Math.min(20.0, currentBack + drift));
    const spread = 0.05 + Math.random() * 0.1; // 5-15 tick spread
    const newLay = Math.min(newBack + spread, 20.0);

    await this.updateOddsAndPublish({
      match_id: match.id,
      market_type: odds.market_type,
      back_price: newBack,
      lay_price: newLay,
      is_suspended: false,
    });
  }

  // ─────────────────────────────────────────────────────────
  // SHARED: Update DB + Publish to Redis
  // ─────────────────────────────────────────────────────────

  private async updateOddsAndPublish(update: {
    match_id: string;
    market_type: string;
    back_price: number;
    lay_price: number;
    is_suspended: boolean;
  }) {
    const odds = await this.oddsRepo.findOne({
      where: { match_id: update.match_id, market_type: update.market_type as never },
    });
    if (!odds) return;

    odds.back_price = update.back_price.toFixed(2);
    odds.lay_price = update.lay_price.toFixed(2);
    odds.is_suspended = update.is_suspended;
    await this.oddsRepo.save(odds);

    // Publish to Redis → EventsGateway broadcasts to Socket.IO
    const payload = JSON.stringify({
      matchId: update.match_id,
      oddsId: odds.id,
      marketType: update.market_type,
      backPrice: odds.back_price,
      layPrice: odds.lay_price,
      isSuspended: odds.is_suspended,
      timestamp: new Date().toISOString(),
    });

    const isEnabled = await this.redisService.isEnabled();
    if (isEnabled) {
      await this.redisService.publish(`odds:${update.match_id}`, payload);
    }

    this.logger.debug(`Odds updated: match=${update.match_id} back=${odds.back_price} lay=${odds.lay_price}`);
  }
}

interface ProviderOddsMessage {
  match_id?: string;
  market_type?: string;
  back_price: number;
  lay_price: number;
  is_suspended?: boolean;
}
