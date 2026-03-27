import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import { WalletModule } from '../src/modules/wallet/wallet.module';
import { BettingModule } from '../src/modules/betting/betting.module';
import { OddsModule } from '../src/modules/odds/odds.module';
import { AdminModule } from '../src/modules/admin/admin.module';
import { UserEntity, UserRole } from '../src/modules/user/entities/user.entity';
import { WalletEntity } from '../src/modules/wallet/entities/wallet.entity';
import { TransactionEntity } from '../src/modules/wallet/entities/transaction.entity';
import { MatchEntity, MatchStatus, SportType } from '../src/modules/odds/entities/match.entity';
import { OddsEntity, MarketType } from '../src/modules/odds/entities/odds.entity';
import { BetEntity } from '../src/modules/betting/entities/bet.entity';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../src/config/redis.service';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FULL E2E Test Suite — PlayAdda Backend
 * Tests are designed to run against a REAL test database.
 * Start Postgres + Redis with docker compose before running.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Mock Redis to avoid real connections in test
const mockRedisService = {
  getClient: jest.fn(),
  getSubscriber: jest.fn(),
  getPublisher: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(0),
  subscribe: jest.fn().mockResolvedValue(undefined),
  psubscribe: jest.fn().mockResolvedValue(undefined),
};

describe('PlayAdda API (E2E)', () => {
  let app: INestApplication;
  let userRepo: Repository<UserEntity>;
  let walletRepo: Repository<WalletEntity>;
  let matchRepo: Repository<MatchEntity>;
  let oddsRepo: Repository<OddsEntity>;
  let betRepo: Repository<BetEntity>;

  // Shared state across tests
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let testMatchId: string;
  let testOddsId: string;
  let testBetId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'playadda',
          password: process.env.DB_PASSWORD || 'playadda_secret',
          database: process.env.DB_NAME || 'playadda_test',
          entities: [UserEntity, WalletEntity, TransactionEntity, MatchEntity, OddsEntity, BetEntity],
          synchronize: true, // OK for test DB
          dropSchema: true,  // Fresh schema each test run
          logging: false,
        }),
        AuthModule,
        UserModule,
        WalletModule,
        BettingModule,
        OddsModule,
        AdminModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalGuards(new JwtAuthGuard(moduleRef.get(Reflector)), new RolesGuard(moduleRef.get(Reflector)));
    app.setGlobalPrefix('api/v1');
    await app.init();

    userRepo = moduleRef.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    walletRepo = moduleRef.get<Repository<WalletEntity>>(getRepositoryToken(WalletEntity));
    matchRepo = moduleRef.get<Repository<MatchEntity>>(getRepositoryToken(MatchEntity));
    oddsRepo = moduleRef.get<Repository<OddsEntity>>(getRepositoryToken(OddsEntity));
    betRepo = moduleRef.get<Repository<BetEntity>>(getRepositoryToken(BetEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 1: AUTH
  // ──────────────────────────────────────────────────────────
  describe('1. Auth — POST /auth/register', () => {
    it('should register a new user and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'testuser@playadda.com', password: 'Test1234!', username: 'testuser' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.user.email).toBe('testuser@playadda.com');
      expect(res.body.data.user.password_hash).toBeUndefined(); // Must never return this

      userToken = res.body.data.access_token;
      userId = res.body.data.user.id;
    });

    it('should reject duplicate email with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'testuser@playadda.com', password: 'Test1234!', username: 'anotheruser' })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should reject weak password with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'weak@test.com', password: 'password', username: 'weakuser' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Test1234!', username: 'validuser' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should auto-create admin user for testing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'admin@playadda.com', password: 'Admin1234!', username: 'adminuser' })
        .expect(201);

      // Promote to admin directly in DB
      await userRepo.update({ email: 'admin@playadda.com' }, { role: UserRole.ADMIN });

      // Login again to get fresh token with ADMIN role
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@playadda.com', password: 'Admin1234!' })
        .expect(200);

      adminToken = loginRes.body.data.access_token;
    });
  });

  describe('2. Auth — POST /auth/login', () => {
    it('should login and return JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'testuser@playadda.com', password: 'Test1234!' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      userToken = res.body.data.access_token; // Refresh token
    });

    it('should reject wrong password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'testuser@playadda.com', password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@playadda.com', password: 'Test1234!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated access to protected routes with 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 2: USER
  // ──────────────────────────────────────────────────────────
  describe('3. Users — GET /users/me', () => {
    it('should return user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('testuser@playadda.com');
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.referral_code).toHaveLength(8);
    });

    it('should return referrals list (empty)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/referrals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 3: WALLET
  // ──────────────────────────────────────────────────────────
  describe('4. Wallet — GET /wallet', () => {
    it('should return wallet with zero balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.locked_balance).toBe(0);
      expect(res.body.data.available_balance).toBe(0);
    });
  });

  describe('5. Wallet — POST /wallet/deposit', () => {
    it('should deposit funds successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 10000 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(10000);
      expect(res.body.data.available_balance).toBe(10000);
    });

    it('should reject negative amount with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: -500 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject zero amount with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/wallet/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 0 })
        .expect(400);
    });
  });

  describe('6. Wallet — POST /wallet/withdraw', () => {
    it('should withdraw funds successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 2000 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(8000);
    });

    it('should reject overdraft with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 999999 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/insufficient/i);
    });
  });

  describe('7. Wallet — GET /wallet/transactions', () => {
    it('should return paginated transaction history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/wallet/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2); // deposit + withdraw
    });
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 4: ODDS (public)
  // ──────────────────────────────────────────────────────────
  describe('8. Odds — Public endpoints', () => {
    it('GET /odds/live — should return empty list (no live matches yet)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/odds/live')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /odds/:matchId — should 404 for unknown match', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/odds/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 5: ADMIN
  // ──────────────────────────────────────────────────────────
  describe('9. Admin — POST /admin/matches', () => {
    it('should reject non-admin user with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${userToken}`) // Regular user token
        .send({
          sport: SportType.CRICKET,
          tournament: 'IPL 2026',
          team_a: 'Mumbai Indians',
          team_b: 'CSK',
          scheduled_at: '2026-04-01T14:00:00.000Z',
        })
        .expect(403);
    });

    it('should allow admin to create a match', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sport: SportType.CRICKET,
          tournament: 'IPL 2026',
          team_a: 'Mumbai Indians',
          team_b: 'CSK',
          scheduled_at: '2026-04-01T14:00:00.000Z',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      testMatchId = res.body.data.id;
      expect(testMatchId).toBeDefined();

      // Verify odds were auto-created
      const odds = await oddsRepo.find({ where: { match_id: testMatchId } });
      expect(odds).toHaveLength(1);
      expect(odds[0].market_type).toBe(MarketType.MATCH_ODDS);
      testOddsId = odds[0].id;
    });

    it('should allow admin to update odds (and trigger Redis publish)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/odds/${testOddsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ back_price: 1.85, lay_price: 1.92, liquidity: 75000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.back_price).toBe('1.85');
      expect(res.body.data.lay_price).toBe('1.92');
      expect(mockRedisService.publish).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  // ✅ TEST GROUP 6: BETTING
  // ──────────────────────────────────────────────────────────
  describe('10. Bets — POST /bets/place', () => {
    beforeAll(async () => {
      // Set match to LIVE so bets can be placed
      await matchRepo.update(testMatchId, { status: MatchStatus.LIVE });
    });

    it('should place a BACK bet and lock funds', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bets/place')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          match_id: testMatchId,
          odds_id: testOddsId,
          bet_type: 'BACK',
          stake: 1000,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      testBetId = res.body.data.id;
      expect(testBetId).toBeDefined();
      expect(res.body.data.status).toBe('PENDING');
      expect(parseFloat(res.body.data.stake)).toBe(1000);
      expect(parseFloat(res.body.data.potential_payout)).toBeGreaterThan(1000);

      // Wallet should have locked funds now
      const wallet = await walletRepo.findOne({ where: { user_id: userId } });
      expect(parseFloat(wallet!.locked_balance)).toBe(1000);
    });

    it('should reject bet larger than available balance', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bets/place')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ match_id: testMatchId, odds_id: testOddsId, bet_type: 'BACK', stake: 99999 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/insufficient/i);
    });

    it('should reject bet below minimum stake (10)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bets/place')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ match_id: testMatchId, odds_id: testOddsId, bet_type: 'BACK', stake: 5 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('11. Bets — GET /bets/history', () => {
    it('should return bet history with match + odds relations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bets/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.data[0].id).toBeDefined();
      expect(res.body.data.data[0].match).toBeDefined();
    });
  });

  describe('12. Admin — Settle Bet (WIN flow)', () => {
    it('should settle bet as WIN and credit payout to wallet', async () => {
      const walletBefore = await walletRepo.findOne({ where: { user_id: userId } });
      const balanceBefore = parseFloat(walletBefore!.balance);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/bets/${testBetId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ won: true })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('WON');
      expect(res.body.data.settled_at).toBeDefined();

      // Wallet should be updated: balance increased, locked released
      const walletAfter = await walletRepo.findOne({ where: { user_id: userId } });
      expect(parseFloat(walletAfter!.locked_balance)).toBe(0); // Lock released
      expect(parseFloat(walletAfter!.balance)).toBeGreaterThan(balanceBefore); // Payout credited
    });

    it('should reject settling already-settled bet with 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/bets/${testBetId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ won: false })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already settled/i);
    });
  });

  describe('13. Admin — Settle Bet (LOSS flow)', () => {
    let lossBetId: string;

    it('should place another bet for LOSS test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bets/place')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ match_id: testMatchId, odds_id: testOddsId, bet_type: 'BACK', stake: 500 })
        .expect(201);

      lossBetId = res.body.data.id;
    });

    it('should settle bet as LOSS and deduct stake', async () => {
      const walletBefore = await walletRepo.findOne({ where: { user_id: userId } });
      const balanceBefore = parseFloat(walletBefore!.balance);
      const lockedBefore = parseFloat(walletBefore!.locked_balance);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/bets/${lossBetId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ won: false })
        .expect(201);

      expect(res.body.data.status).toBe('LOST');

      const walletAfter = await walletRepo.findOne({ where: { user_id: userId } });
      expect(parseFloat(walletAfter!.balance)).toBe(balanceBefore - 500); // Stake deducted
      expect(parseFloat(walletAfter!.locked_balance)).toBe(lockedBefore - 500); // Lock released
    });
  });

  describe('14. Security — Input validation & edge cases', () => {
    it('should strip unknown fields (whitelist: true)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'testuser@playadda.com', password: 'Test1234!', is_admin: true }) // 'is_admin' is unknown
        .expect(200); // Should succeed but strip is_admin

      expect(res.body.success).toBe(true);
    });

    it('should reject requests with extra unknown fields (forbidNonWhitelisted)', async () => {
      // PlaceBetDto has forbid extra fields — unknown field 'hacked' should reject
      const res = await request(app.getHttpServer())
        .post('/api/v1/bets/place')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          match_id: testMatchId,
          odds_id: testOddsId,
          bet_type: 'BACK',
          stake: 100,
          hacked: true, // Unknown field
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
