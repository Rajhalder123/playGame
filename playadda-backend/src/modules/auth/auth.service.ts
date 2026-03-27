import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../user/entities/user.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { TransactionEntity, TransactionType } from '../wallet/entities/transaction.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
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
    const rounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '12'), 10);
    const password_hash = await bcrypt.hash(dto.password, rounds);

    // Generate unique referral code
    const referral_code = this.generateReferralCode();

    // Resolve referral code to referrer's user ID
    const referrerId = dto.referral_code
      ? await this.findUserIdByReferralCode(dto.referral_code)
      : null;

    // Create user
    const user = this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      username: dto.username.trim(),
      password_hash,
      referral_code,
      referred_by: referrerId,
    });
    const savedUser = await this.userRepo.save(user);

    // Create wallet (1:1 linked to user)
    const wallet = this.walletRepo.create({
      user_id: savedUser.id,
      balance: '0',
      locked_balance: '0',
    });
    await this.walletRepo.save(wallet);

    // ── Referral bonus: credit 100 to referrer's wallet ───────────
    if (referrerId) {
      const REFERRAL_BONUS = 100;
      const referrerWallet = await this.walletRepo.findOne({ where: { user_id: referrerId } });
      if (referrerWallet) {
        const balBefore = parseFloat(referrerWallet.balance);
        referrerWallet.balance = (balBefore + REFERRAL_BONUS).toFixed(8);
        await this.walletRepo.save(referrerWallet);
        // Record the bonus transaction
        await this.transactionRepo.save(
          this.transactionRepo.create({
            wallet_id: referrerWallet.id,
            type: TransactionType.REFERRAL_BONUS,
            amount: REFERRAL_BONUS.toFixed(8),
            balance_before: balBefore.toFixed(8),
            balance_after: referrerWallet.balance,
            reference_id: savedUser.id,
            note: `Referral bonus for inviting ${savedUser.username}`,
          }),
        );
      }
    }

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
