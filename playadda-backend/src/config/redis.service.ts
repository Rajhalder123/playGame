import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly publisher: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      lazyConnect: false,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    this.client.on('error', (err) => console.error('[Redis Client]', err));
    this.subscriber.on('error', (err) => console.error('[Redis Subscriber]', err));
    this.publisher.on('error', (err) => console.error('[Redis Publisher]', err));
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch: string, msg: string) => {
      if (ch === channel) handler(msg);
    });
  }

  async psubscribe(pattern: string, handler: (channel: string, message: string) => void): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (_pattern: string, ch: string, msg: string) => {
      handler(ch, msg);
    });
  }
}
