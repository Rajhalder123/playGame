import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Lazy-load ioredis so the app can start without Redis
let Redis: typeof import('ioredis').default;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Redis = require('ioredis').default || require('ioredis');
} catch {
  /* ioredis not available — Redis features disabled */
}

type RedisClient = import('ioredis').default;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClient | null = null;
  private subscriber: RedisClient | null = null;
  private publisher: RedisClient | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const isDisabled = this.configService.get<string>('REDIS_DISABLED', 'false') === 'true';

    if (isDisabled || !Redis) {
      this.enabled = false;
      this.logger.warn('⚠️  Redis is DISABLED — real-time WebSocket odds broadcast will not function');
      return;
    }

    this.enabled = true;
    const cfg = {
      host,
      port,
      password,
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 300, 2000)),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    };

    try {
      this.client = new Redis(cfg);
      this.subscriber = new Redis(cfg);
      this.publisher = new Redis(cfg);

      this.client.on('error', (e) => this.logger.error('[Redis Client]', e.message));
      this.subscriber.on('error', (e) => this.logger.error('[Redis Sub]', e.message));
      this.publisher.on('error', (e) => this.logger.error('[Redis Pub]', e.message));

      // Non-blocking connect
      void this.client.connect().catch((e) => this.logger.warn(`Redis client offline: ${e.message}`));
      void this.subscriber.connect().catch((e) => this.logger.warn(`Redis sub offline: ${e.message}`));
      void this.publisher.connect().catch((e) => this.logger.warn(`Redis pub offline: ${e.message}`));
    } catch (e) {
      this.logger.warn('Redis init failed — continuing without Redis');
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
    this.subscriber?.disconnect();
    this.publisher?.disconnect();
  }

  isEnabled(): boolean { return this.enabled && !!this.client; }
  getClient(): RedisClient | null { return this.client; }
  getSubscriber(): RedisClient | null { return this.subscriber; }
  getPublisher(): RedisClient | null { return this.publisher; }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      if (ttlSeconds) await this.client!.set(key, value, 'EX', ttlSeconds);
      else await this.client!.set(key, value);
    } catch { /* offline — ignore */ }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isEnabled()) return null;
    try { return await this.client!.get(key); } catch { return null; }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled()) return;
    try { await this.client!.del(key); } catch { /* offline */ }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.isEnabled()) return;
    try { await this.publisher!.publish(channel, message); } catch { /* offline */ }
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await this.subscriber!.subscribe(channel);
      this.subscriber!.on('message', (ch: string, msg: string) => {
        if (ch === channel) handler(msg);
      });
    } catch { /* offline */ }
  }

  async psubscribe(pattern: string, handler: (channel: string, message: string) => void): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await this.subscriber!.psubscribe(pattern);
      this.subscriber!.on('pmessage', (_p: string, ch: string, msg: string) => handler(ch, msg));
    } catch { /* offline */ }
  }
}
