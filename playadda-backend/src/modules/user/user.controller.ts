import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile (no password_hash)' })
  getProfile(@CurrentUser() user: UserEntity) {
    return this.userService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (username)' })
  @ApiResponse({ status: 200, description: 'Updated profile returned' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  updateProfile(@CurrentUser() user: UserEntity, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Get('referrals')
  @ApiOperation({ summary: 'Get list of users referred by current user' })
  @ApiResponse({ status: 200, description: 'List of referred users' })
  getReferrals(@CurrentUser() user: UserEntity) {
    return this.userService.getReferrals(user.id);
  }
}
