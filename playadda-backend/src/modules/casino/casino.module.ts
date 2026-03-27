import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasinoController } from './casino.controller';
import { CasinoService } from './casino.service';
import { CasinoSessionEntity } from './entities/casino-session.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CasinoSessionEntity, WalletEntity, TransactionEntity]),
  ],
  controllers: [CasinoController],
  providers: [CasinoService],
  exports: [CasinoService],
})
export class CasinoModule {}
