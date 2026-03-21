import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { WalletService } from './wallet.service';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class AmountDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: UserEntity) {
    return this.walletService.getWallet(user.id);
  }

  @Post('deposit')
  deposit(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.walletService.deposit(user.id, dto.amount);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.walletService.withdraw(user.id, dto.amount);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.walletService.getTransactions(user.id, +page, +limit);
  }
}
