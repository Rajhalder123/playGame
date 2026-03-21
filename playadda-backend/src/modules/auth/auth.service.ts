import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../user/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string; user: Partial<UserEntity> }> {
    // Check for existing email/username
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email ? 'Email already in use' : 'Username already taken',
      );
    }

    // Hash password
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const password_hash = await bcrypt.hash(dto.password, rounds);

    // Generate unique referral code
    const referral_code = this.generateReferralCode();

    // Create user
    const user = this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      username: dto.username.trim(),
      password_hash,
      referral_code,
      referred_by: dto.referral_code
        ? await this.findUserIdByReferralCode(dto.referral_code)
        : null,
    });
    const savedUser = await this.userRepo.save(user);

    // Create wallet (1:1 linked to user)
    const wallet = this.walletRepo.create({
      user_id: savedUser.id,
      balance: '0',
      locked_balance: '0',
    });
    await this.walletRepo.save(wallet);

    const access_token = this.signToken(savedUser);
    return { access_token, user: this.sanitizeUser(savedUser) };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: Partial<UserEntity> }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    const access_token = this.signToken(user);
    return { access_token, user: this.sanitizeUser(user) };
  }

  private signToken(user: UserEntity): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private sanitizeUser(user: UserEntity): Partial<UserEntity> {
    const { password_hash: _pw, ...safe } = user as UserEntity & { password_hash: string };
    return safe;
  }

  private generateReferralCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  }

  private async findUserIdByReferralCode(code: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { referral_code: code } });
    return user?.id ?? null;
  }
}
