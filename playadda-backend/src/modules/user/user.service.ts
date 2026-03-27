import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<Omit<UserEntity, 'password_hash'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username && dto.username !== user.username) {
      const taken = await this.userRepo.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username already taken');
      user.username = dto.username;
    }

    const saved = await this.userRepo.save(user);
    const { password_hash: _pw, ...safe } = saved as UserEntity & { password_hash: string };
    return safe;
  }

  async getReferrals(userId: string): Promise<Partial<UserEntity>[]> {
    return this.userRepo.find({
      where: { referred_by: userId },
      select: ['id', 'username', 'email', 'created_at'],
    });
  }
}
