import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { CasinoSessionEntity, CasinoProvider, CasinoSessionStatus } from './entities/casino-session.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { TransactionEntity, TransactionType } from '../wallet/entities/transaction.entity';
import { LaunchGameDto } from './dto/launch-game.dto';

// ─── Game Catalogue ──────────────────────────────────────────────────────────
// This catalogue mirrors exactly what providers like Evolution / Ezugi expose.
// In production: fetch from provider's /api/games endpoint and cache in Redis.

export const GAME_CATALOGUE = [
  // Live Casino
  { id: 'crazy-time-001', name: 'Crazy Time', category: 'Live Casino', provider: 'Evolution', thumbnail: 'crazy-time', isHot: true, minBet: 10, maxBet: 100000 },
  { id: 'lightning-roulette-001', name: 'Lightning Roulette', category: 'Live Casino', provider: 'Evolution', thumbnail: 'lightning-roulette', isHot: true, minBet: 10, maxBet: 50000 },
  { id: 'blackjack-001', name: 'Blackjack Live', category: 'Live Casino', provider: 'Evolution', thumbnail: 'blackjack', isHot: false, minBet: 50, maxBet: 200000 },
  { id: 'baccarat-001', name: 'Baccarat Speed', category: 'Live Casino', provider: 'Evolution', thumbnail: 'baccarat', isHot: false, minBet: 25, maxBet: 100000 },
  { id: 'auto-roulette-001', name: 'Auto Roulette', category: 'Live Casino', provider: 'Ezugi', thumbnail: 'auto-roulette', isHot: false, minBet: 10, maxBet: 25000 },
  // Indian Games
  { id: 'teen-patti-001', name: 'Teen Patti Live', category: 'Indian Games', provider: 'Ezugi', thumbnail: 'teen-patti', isHot: true, minBet: 10, maxBet: 50000 },
  { id: 'andar-bahar-001', name: 'Andar Bahar Live', category: 'Indian Games', provider: 'Ezugi', thumbnail: 'andar-bahar', isHot: true, minBet: 10, maxBet: 25000 },
  { id: '32-cards-001', name: '32 Cards', category: 'Indian Games', provider: 'Ezugi', thumbnail: '32-cards', isHot: false, minBet: 10, maxBet: 10000 },
  { id: 'dragon-tiger-001', name: 'Dragon Tiger', category: 'Indian Games', provider: 'Ezugi', thumbnail: 'dragon-tiger', isHot: false, minBet: 10, maxBet: 25000 },
  // Crash Games
  { id: 'aviator-001', name: 'Aviator', category: 'Crash Games', provider: 'Spribe', thumbnail: 'aviator', isHot: true, minBet: 10, maxBet: 50000 },
  { id: 'jetx-001', name: 'JetX', category: 'Crash Games', provider: 'SmartSoft', thumbnail: 'jetx', isHot: false, minBet: 10, maxBet: 50000 },
  { id: 'mines-001', name: 'Mines', category: 'Crash Games', provider: 'Spribe', thumbnail: 'mines', isHot: false, minBet: 10, maxBet: 10000 },
  // Slots
  { id: 'starburst-001', name: 'Starburst', category: 'Slots', provider: 'NetEnt', thumbnail: 'starburst', isHot: false, minBet: 10, maxBet: 5000 },
  { id: 'gates-olympus-001', name: 'Gates of Olympus', category: 'Slots', provider: 'Pragmatic', thumbnail: 'gates-olympus', isHot: true, minBet: 10, maxBet: 25000 },
];

@Injectable()
export class CasinoService {
  private readonly logger = new Logger(CasinoService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(CasinoSessionEntity)
    private readonly sessionRepo: Repository<CasinoSessionEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
  ) {}

  getGames(category?: string) {
    const games = category
      ? GAME_CATALOGUE.filter((g) => g.category.toLowerCase() === category.toLowerCase())
      : GAME_CATALOGUE;
    return { data: games, total: games.length };
  }

  /**
   * launchGame — generates a session token and returns an iFrame URL.
   *
   * DEMO mode: returns a built-in HTML demo page with game branding.
   * EVOLUTION: calls Evolution SessionAPI to get a real launch URL.
   * EZUGI: calls Ezugi's /getToken endpoint.
   */
  async launchGame(userId: string, dto: LaunchGameDto): Promise<{ launch_url: string; session_id: string }> {
    const game = GAME_CATALOGUE.find((g) => g.id === dto.game_id);
    if (!game) throw new NotFoundException(`Game '${dto.game_id}' not found`);

    const wallet = await this.walletRepo.findOne({ where: { user_id: userId } });
    if (!wallet) throw new BadRequestException('Wallet not found');

    const token = uuidv4().replace(/-/g, '').toUpperCase();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        user_id: userId,
        session_token: token,
        game_id: game.id,
        game_name: game.name,
        provider: this.resolveProvider(game.provider),
        status: CasinoSessionStatus.ACTIVE,
        expires_at: expiresAt,
      }),
    );

    const provider = this.configService.get<string>('CASINO_PROVIDER', 'DEMO');
    let launchUrl: string;

    switch (provider) {
      case 'EVOLUTION':
        launchUrl = await this.getEvolutionLaunchUrl(token, game.id, dto);
        break;
      case 'EZUGI':
        launchUrl = await this.getEzugiLaunchUrl(token, game.id, dto);
        break;
      case 'SUPERNOWA':
        launchUrl = await this.getSupernowaLaunchUrl(token, game.id, dto);
        break;
      default:
        launchUrl = this.getDemoLaunchUrl(token, game);
        break;
    }

    this.logger.log(`Game launched: ${game.name} (${session.id}) for user ${userId}`);
    return { launch_url: launchUrl, session_id: session.id };
  }

  // ─── Provider: Evolution Gaming ──────────────────────────────────────────
  private async getEvolutionLaunchUrl(token: string, gameId: string, dto: LaunchGameDto): Promise<string> {
    const apiUrl = this.configService.getOrThrow<string>('CASINO_PROVIDER_URL');
    const apiKey = this.configService.getOrThrow<string>('CASINO_PROVIDER_API_KEY');
    const callbackUrl = this.configService.getOrThrow<string>('CASINO_CALLBACK_URL');

    // Evolution Gaming API format
    const body = {
      uuid: token,
      player: { id: token, update: true, firstName: 'Player', lastName: '', country: 'IN', language: dto.language || 'en', currency: 'INR', session: { id: token, ip: '127.0.0.1' } },
      config: { game: { enabled: true, table: { id: gameId } }, channel: { wrapped: false, mobile: dto.platform === 'mobile' }, urls: { cashier: `${callbackUrl}/wallet`, lobby: '/', responsibleGaming: '/' } },
    };

    const response = await fetch(`${apiUrl}/api/v2/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `${apiKey}` },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { entry?: string };
    if (!data.entry) throw new BadRequestException('Evolution: failed to get launch URL');
    return data.entry;
  }

  // ─── Provider: Ezugi ─────────────────────────────────────────────────────
  private async getEzugiLaunchUrl(token: string, gameId: string, dto: LaunchGameDto): Promise<string> {
    const apiUrl = this.configService.getOrThrow<string>('CASINO_PROVIDER_URL');
    const apiKey = this.configService.getOrThrow<string>('CASINO_PROVIDER_API_KEY');

    const params = new URLSearchParams({
      OperatorId: apiKey,
      Token: token,
      TableID: gameId,
      Language: dto.language || 'en',
      Channel: dto.platform === 'mobile' ? 'MOBILE' : 'WEB',
    });

    const response = await fetch(`${apiUrl}/getToken?${params.toString()}`);
    const data = (await response.json()) as { token?: string };
    if (!data.token) throw new BadRequestException('Ezugi: failed to get launch URL');
    return `${apiUrl}/launch?token=${data.token}&tableID=${gameId}`;
  }

  // ─── Provider: Supernowa ─────────────────────────────────────────────────
  private async getSupernowaLaunchUrl(token: string, gameId: string, dto: LaunchGameDto): Promise<string> {
    const apiUrl = this.configService.getOrThrow<string>('CASINO_PROVIDER_URL');
    const apiKey = this.configService.getOrThrow<string>('CASINO_PROVIDER_API_KEY');

    const response = await fetch(`${apiUrl}/getLaunchUrl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ token, gameId, currency: 'INR', lang: dto.language || 'en' }),
    });

    const data = (await response.json()) as { url?: string };
    if (!data.url) throw new BadRequestException('Supernowa: failed to get launch URL');
    return data.url;
  }

  // ─── Real-money bet flow ─────────────────────────────────────────────────
  /**
   * placeCasinoBet — debit stake from real wallet.
   * Called by frontend BEFORE each round starts.
   * Returns round_id (casino session id) + new wallet balance.
   */
  async placeCasinoBet(
    userId: string,
    gameId: string,
    gameName: string,
    stake: number,
  ): Promise<{ round_id: string; balance: number }> {
    const game = GAME_CATALOGUE.find((g) => g.id === gameId);
    if (!game) throw new NotFoundException(`Game '${gameId}' not found`);
    if (stake < 1) throw new BadRequestException('Minimum stake is ₹1');

    return this.dataSource.transaction(async (manager) => {
      // Lock wallet row to prevent race conditions
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :uid', { uid: userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) throw new BadRequestException('Wallet not found');

      const bal = parseFloat(wallet.balance);
      const locked = parseFloat(wallet.locked_balance);
      const available = bal - locked;

      if (available < stake) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₹${available.toFixed(2)}, Required: ₹${stake.toFixed(2)}`,
        );
      }

      // Create session record for this round
      const token = uuidv4().replace(/-/g, '').toUpperCase();
      const session = await manager.save(
        manager.create(CasinoSessionEntity, {
          user_id: userId,
          session_token: token,
          game_id: gameId,
          game_name: gameName,
          provider: this.resolveProvider(game.provider),
          status: CasinoSessionStatus.ACTIVE,
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
        }),
      );

      // Debit: increase locked balance (stake is "in play")
      wallet.locked_balance = (locked + stake).toFixed(8);
      await manager.save(wallet);

      await manager.save(
        manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.BET_LOCK,
          amount: stake.toFixed(8),
          balance_before: bal.toFixed(8),
          balance_after: bal.toFixed(8),
          reference_id: session.id,
          note: `Casino bet — ${gameName}`,
        }),
      );

      this.logger.log(`Casino bet placed: ${gameName} ₹${stake} by user ${userId} [${session.id}]`);
      return { round_id: session.id, balance: bal - locked - stake };
    });
  }

  /**
   * settleCasinoRound — credit winnings (or record loss) after a round ends.
   * winAmount = 0 means loss. winAmount > 0 means the total returned to player.
   */
  async settleCasinoRound(
    userId: string,
    roundId: string,
    winAmount: number,
    stake: number,
  ): Promise<{ balance: number; net: number }> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(CasinoSessionEntity, { where: { id: roundId, user_id: userId } });
      if (!session) throw new NotFoundException('Casino round not found');
      if (session.status !== CasinoSessionStatus.ACTIVE) {
        throw new BadRequestException('Round already settled');
      }

      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :uid', { uid: userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) throw new BadRequestException('Wallet not found');

      const bal = parseFloat(wallet.balance);
      const locked = parseFloat(wallet.locked_balance);

      // Release locked stake
      const newLocked = Math.max(0, locked - stake);

      let newBalance = bal;
      let txType: TransactionType;
      let note: string;

      if (winAmount > 0) {
        // Win: deduct stake from balance + add winnings
        newBalance = bal - stake + winAmount;
        txType = TransactionType.BET_WIN;
        note = `Casino win — ${session.game_name} stake:₹${stake} win:₹${winAmount}`;
      } else {
        // Loss: deduct stake from balance
        newBalance = bal - stake;
        txType = TransactionType.BET_LOSS;
        note = `Casino loss — ${session.game_name} stake:₹${stake}`;
      }

      wallet.balance = newBalance.toFixed(8);
      wallet.locked_balance = newLocked.toFixed(8);
      await manager.save(wallet);

      await manager.save(
        manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: txType,
          amount: (winAmount > 0 ? winAmount : stake).toFixed(8),
          balance_before: bal.toFixed(8),
          balance_after: newBalance.toFixed(8),
          reference_id: roundId,
          note,
        }),
      );

      // Mark session as completed with result
      session.status = CasinoSessionStatus.COMPLETED;
      session.total_wagered = stake.toFixed(8);
      session.net_result = (winAmount - stake).toFixed(8);
      session.round_result = winAmount > stake ? 'WIN' : winAmount > 0 ? 'PUSH' : 'LOSS';
      await manager.save(session);

      const net = winAmount - stake;
      this.logger.log(`Casino settled: ${session.game_name} net:₹${net} user:${userId}`);
      return { balance: newBalance - newLocked, net };
    });
  }

  /**
   * getCasinoHistory — paginated list of casino rounds for a user.
   */
  async getCasinoHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: CasinoSessionEntity[]; total: number }> {
    const [data, total] = await this.sessionRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // ─── Provider: DEMO (built-in) ───────────────────────────────────────────
  // Points to the Next.js frontend route /casino/demo/[token] — same origin as the
  // iFrame parent, so no CSP frame-ancestors violation occurs.
  private getDemoLaunchUrl(token: string, game: (typeof GAME_CATALOGUE)[0]): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    return `${frontendUrl}/casino/demo/${token}?game=${game.id}&name=${encodeURIComponent(game.name)}&provider=${encodeURIComponent(game.provider)}`;
  }

  /**
   * Serves an HTML demo game page — shown when no real provider is configured.
   * This lets developers test the iFrame integration flow without real credentials.
   */
  getDemoGameHtml(token: string, gameId: string, gameName: string, providerName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gameName} — PlayAdda Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0f0a; color: #fff; font-family: 'Inter', sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .badge { background: #c6ff00; color: #000; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-size: 2rem; font-weight: 900; margin-bottom: 8px; }
    .provider { font-size: 14px; color: #4caf50; font-weight: 600; margin-bottom: 24px; }
    .screen { background: linear-gradient(135deg, #0f2b1a 0%, #1b5e20 50%, #0f2b1a 100%); border: 2px solid #1e4d2b; border-radius: 16px; width: min(500px, 90vw); height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; position: relative; overflow: hidden; }
    .screen::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(198,255,0,0.1) 0%, transparent 70%); }
    .big-icon { font-size: 64px; filter: drop-shadow(0 0 20px rgba(198,255,0,0.5)); animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
    .result { font-size: 18px; font-weight: 700; color: #c6ff00; }
    .btn { padding: 14px 32px; background: #4caf50; color: #fff; font-size: 15px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .btn:hover { background: #2e7d32; transform: translateY(-1px); }
    .info { font-size: 12px; color: #8a9a8a; text-align: center; margin-top: 8px; }
    .token { font-size: 10px; color: #333; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="badge">🎮 Demo Mode</div>
  <h1>${gameName}</h1>
  <div class="provider">by ${providerName}</div>
  <div class="screen" id="screen">
    <div class="big-icon" id="icon">🎰</div>
    <div class="result" id="result">Press SPIN to play!</div>
  </div>
  <button class="btn" onclick="spin()">SPIN 🎲</button>
  <p class="info">This is a DEMO game. Connect <strong>Evolution / Ezugi / Supernowa</strong><br>in your .env to play with real provider games.</p>
  <p class="token">Session: ${token.slice(0, 16)}...</p>

  <script>
    const icons = ['🎰','💎','🃏','🎲','⭐','🏆','🍀','🔥'];
    const results = [
      { text: 'BIG WIN! +₹250', color: '#c6ff00' },
      { text: 'WIN! +₹80', color: '#4caf50' },
      { text: 'Try again! -₹50', color: '#f44336' },
      { text: 'JACKPOT! +₹1000 🎉', color: '#ffd700' },
      { text: 'Push! No change', color: '#aaa' },
      { text: 'Small WIN +₹30', color: '#4caf50' },
    ];
    let spinning = false;
    function spin() {
      if (spinning) return;
      spinning = true;
      let t = 0;
      const interval = setInterval(() => {
        document.getElementById('icon').textContent = icons[Math.floor(Math.random()*icons.length)];
        t++;
        if (t > 15) {
          clearInterval(interval);
          const r = results[Math.floor(Math.random()*results.length)];
          document.getElementById('result').textContent = r.text;
          document.getElementById('result').style.color = r.color;
          spinning = false;
        }
      }, 80);
    }
  </script>
</body>
</html>`;
  }

  /**
   * handleProviderCallback — wallet callback from casino provider.
   *
   * Providers call this endpoint to debit/credit the user's wallet
   * when they place a bet or win inside the game.
   *
   * This implements the "Seamless Wallet" pattern used by Evolution, Ezugi, etc.
   */
  async handleProviderCallback(body: CasinoCallbackBody): Promise<CasinoCallbackResponse> {
    this.logger.log(`Casino callback: type=${body.type} token=${body.session_token} amount=${body.amount}`);

    const session = await this.sessionRepo.findOne({ where: { session_token: body.session_token } });
    if (!session) return { code: 'SESSION_NOT_FOUND', balance: 0 };

    if (session.status !== CasinoSessionStatus.ACTIVE) {
      return { code: 'SESSION_EXPIRED', balance: 0 };
    }

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager
        .createQueryBuilder(WalletEntity, 'w')
        .where('w.user_id = :uid', { uid: session.user_id })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) return { code: 'WALLET_NOT_FOUND', balance: 0 };

      const balance = parseFloat(wallet.balance);
      const amount = parseFloat(body.amount.toString());

      if (body.type === 'DEBIT') {
        if (balance < amount) return { code: 'INSUFFICIENT_FUNDS', balance };
        wallet.balance = (balance - amount).toFixed(8);

        await manager.save(manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.BET_LOCK,
          amount: amount.toFixed(8),
          balance_before: balance.toFixed(8),
          balance_after: wallet.balance,
          reference_id: body.transaction_id,
          note: `Casino: ${session.game_name} — bet`,
        }));
      } else if (body.type === 'CREDIT') {
        wallet.balance = (balance + amount).toFixed(8);

        await manager.save(manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.BET_WIN,
          amount: amount.toFixed(8),
          balance_before: balance.toFixed(8),
          balance_after: wallet.balance,
          reference_id: body.transaction_id,
          note: `Casino: ${session.game_name} — win`,
        }));
      } else if (body.type === 'REFUND') {
        wallet.balance = (balance + amount).toFixed(8);

        await manager.save(manager.create(TransactionEntity, {
          wallet_id: wallet.id,
          type: TransactionType.BET_VOID,
          amount: amount.toFixed(8),
          balance_before: balance.toFixed(8),
          balance_after: wallet.balance,
          reference_id: body.transaction_id,
          note: `Casino: ${session.game_name} — refund`,
        }));
      }

      await manager.save(wallet);
      return { code: 'OK', balance: parseFloat(wallet.balance) };
    });
  }

  /**
   * validateCallbackSignature — verifies HMAC signature from provider.
   * Providers sign their callbacks with a shared secret so you can verify authenticity.
   */
  validateCallbackSignature(payload: string, signature: string): boolean {
    const secret = this.configService.get<string>('CASINO_CALLBACK_SECRET', '');
    if (!secret) return true; // bypass in demo mode
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  private resolveProvider(providerName: string): CasinoProvider {
    const map: Record<string, CasinoProvider> = {
      Evolution: CasinoProvider.EVOLUTION,
      Ezugi: CasinoProvider.EZUGI,
      Supernowa: CasinoProvider.SUPERNOWA,
      Spribe: CasinoProvider.DEMO,
      SmartSoft: CasinoProvider.DEMO,
      NetEnt: CasinoProvider.DEMO,
      Pragmatic: CasinoProvider.DEMO,
    };
    return map[providerName] || CasinoProvider.DEMO;
  }
}

export interface CasinoCallbackBody {
  type: 'DEBIT' | 'CREDIT' | 'REFUND' | 'BALANCE';
  session_token: string;
  transaction_id: string;
  amount: number;
  game_id: string;
  round_id?: string;
}

export interface CasinoCallbackResponse {
  code: string;
  balance: number;
  transaction_id?: string;
}
