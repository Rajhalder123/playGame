import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OddsService } from './odds.service';
import { OddsController } from './odds.controller';
import { MatchEntity } from './entities/match.entity';
import { OddsEntity } from './entities/odds.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MatchEntity, OddsEntity])],
  controllers: [OddsController],
  providers: [OddsService],
  exports: [OddsService],
})
export class OddsModule {}
