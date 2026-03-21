import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BettingService } from './betting.service';
import { BettingController } from './betting.controller';
import { BetEntity } from './entities/bet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { OddsModule } from '../odds/odds.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BetEntity]),
    WalletModule,
    OddsModule,
  ],
  controllers: [BettingController],
  providers: [BettingService],
  exports: [BettingService],
})
export class BettingModule {}
