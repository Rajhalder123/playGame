import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile (no password_hash)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: UserEntity) {
    return this.userService.findById(user.id);
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Get list of users referred by current user' })
  @ApiResponse({ status: 200, description: 'List of referred users' })
  getReferrals(@CurrentUser() user: UserEntity) {
    return this.userService.getReferrals(user.id);
  }
}
