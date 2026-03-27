import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LaunchGameDto {
  @ApiProperty({ example: 'teen-patti-live', description: 'Provider game ID' })
  @IsString()
  game_id: string;

  @ApiPropertyOptional({ example: 'desktop', description: 'Platform: desktop | mobile' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ example: 'en', description: 'Language code' })
  @IsOptional()
  @IsString()
  language?: string;
}
