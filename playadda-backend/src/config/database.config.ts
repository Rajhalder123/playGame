import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { UserEntity } from '../modules/user/entities/user.entity';
import { WalletEntity } from '../modules/wallet/entities/wallet.entity';
import { TransactionEntity } from '../modules/wallet/entities/transaction.entity';
import { MatchEntity } from '../modules/odds/entities/match.entity';
import { OddsEntity } from '../modules/odds/entities/odds.entity';
import { BetEntity } from '../modules/betting/entities/bet.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'playadda'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME', 'playadda_db'),
      entities: [
        UserEntity,
        WalletEntity,
        TransactionEntity,
        MatchEntity,
        OddsEntity,
        BetEntity,
      ],
      synchronize: this.configService.get<string>('DB_SYNC', 'false') === 'true',
      logging: this.configService.get<string>('DB_LOGGING', 'false') === 'true',
      ssl:
        this.configService.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      extra: {
        // Connection pool settings for production load
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };
  }
}
