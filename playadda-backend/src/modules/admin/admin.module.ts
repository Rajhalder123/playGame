import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchEntity } from '../odds/entities/match.entity';
import { OddsEntity } from '../odds/entities/odds.entity';
import { BetEntity } from '../betting/entities/bet.entity';
import { UserEntity } from '../user/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchEntity, OddsEntity, BetEntity, UserEntity, WalletEntity]),
    WalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
