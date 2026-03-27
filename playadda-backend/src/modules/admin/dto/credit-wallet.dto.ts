import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreditWalletDto {
  @ApiProperty({ example: 500, description: 'Amount to credit to the user wallet' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'Promotional bonus credit', description: 'Reason for the credit' })
  reason: string;
}
