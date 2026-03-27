import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import { DatabaseConfig } from './config/database.config';

// Common
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Modules
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { OddsModule } from './modules/odds/odds.module';
import { BettingModule } from './modules/betting/betting.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './modules/events/events.module';
import { CasinoModule } from './modules/casino/casino.module';
import { SportsProviderModule } from './modules/sports-provider/sports-provider.module';

@Module({
  imports: [
    // ── Configuration ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Database ───────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // ── Rate Limiting ──────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
            limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
          },
        ],
      }),
    }),

    // ── Feature Modules ────────────────────────────────────────────
    RedisModule,
    AuthModule,
    UserModule,
    WalletModule,
    OddsModule,
    BettingModule,
    AdminModule,
    EventsModule,
    CasinoModule,
    SportsProviderModule,
  ],

  providers: [
    // Global exception handler
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard (runs after JwtAuthGuard)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
