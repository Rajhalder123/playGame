import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsProviderService } from './sports-provider.service';
import { OddsEntity } from '../odds/entities/odds.entity';
import { MatchEntity } from '../odds/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OddsEntity, MatchEntity])],
  providers: [SportsProviderService],
  exports: [SportsProviderService],
})
export class SportsProviderModule {}
