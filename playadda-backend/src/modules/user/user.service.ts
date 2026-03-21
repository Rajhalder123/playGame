import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<Omit<UserEntity, 'password_hash'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash: _pw, ...safe } = user as UserEntity & { password_hash: string };
    return safe;
  }

  async getReferrals(userId: string): Promise<Partial<UserEntity>[]> {
    const referrals = await this.userRepo.find({
      where: { referred_by: userId },
      select: ['id', 'username', 'email', 'created_at'],
    });
    return referrals;
  }
}
