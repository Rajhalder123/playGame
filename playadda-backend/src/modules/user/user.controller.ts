import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@CurrentUser() user: UserEntity) {
    return this.userService.findById(user.id);
  }

  @Get('referrals')
  getReferrals(@CurrentUser() user: UserEntity) {
    return this.userService.getReferrals(user.id);
  }
}
