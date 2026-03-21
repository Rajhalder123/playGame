import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { WalletService } from './wallet.service';

class AmountDto {
  @ApiProperty({ example: 1000, description: 'Amount to deposit/withdraw (minimum 1)' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;
}

@ApiTags('Wallet')
@ApiBearerAuth('JWT')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance', description: 'Returns balance, locked_balance, and available_balance' })
  @ApiResponse({ status: 200, description: 'Wallet snapshot', schema: {
    example: { balance: 5000, locked_balance: 500, available_balance: 4500 }
  }})
  getWallet(@CurrentUser() user: UserEntity) {
    return this.walletService.getWallet(user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds into wallet' })
  @ApiResponse({ status: 201, description: 'Deposit successful. Returns updated wallet snapshot.' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  deposit(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.walletService.deposit(user.id, dto.amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet', description: 'Only available balance (balance - locked_balance) can be withdrawn' })
  @ApiResponse({ status: 201, description: 'Withdrawal successful.' })
  @ApiResponse({ status: 400, description: 'Insufficient funds or invalid amount' })
  withdraw(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.walletService.withdraw(user.id, dto.amount);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions + total count' })
  getTransactions(
    @CurrentUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.walletService.getTransactions(user.id, +page, +limit);
  }
}
