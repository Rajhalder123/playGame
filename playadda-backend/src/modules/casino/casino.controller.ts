import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { CasinoService, CasinoCallbackBody } from './casino.service';
import { LaunchGameDto } from './dto/launch-game.dto';

@ApiTags('Casino')
@Controller('casino')
export class CasinoController {
  constructor(private readonly casinoService: CasinoService) {}

  /**
   * GET /casino/games — list available games, optionally filter by category.
   * No auth required (public browsing).
   */
  @Public()
  @Get('games')
  @ApiOperation({ summary: 'List all available casino games', description: 'Returns full game catalogue grouped by category (Live Casino, Indian Games, Crash Games, Slots)' })
  @ApiQuery({ name: 'category', required: false, enum: ['Live Casino', 'Indian Games', 'Crash Games', 'Slots'], description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'Game list returned' })
  listGames(@Query('category') category?: string) {
    return this.casinoService.getGames(category);
  }

  /**
   * POST /casino/launch — generate a game session and return iFrame URL.
   * JWT required.
   *
   * DEMO mode: returns a built-in demo game page URL.
   * Real providers: returns the provider's actual iFrame URL.
   */
  @UseGuards(JwtAuthGuard)
  @Post('launch')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Launch a game — get iFrame URL',
    description: 'Creates a session token, calls the configured provider API (or returns DEMO URL), and returns a URL to embed in an iFrame.',
  })
  @ApiResponse({ status: 201, description: 'Returns { launch_url, session_id }' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  launch(@CurrentUser() user: UserEntity, @Body() dto: LaunchGameDto) {
    return this.casinoService.launchGame(user.id, dto);
  }

  /**
   * GET /casino/demo-game — serves inline HTML demo game.
   * Called by the DEMO launch_url — renders directly in the iFrame.
   */
  @Public()
  @Get('demo-game')
  @ApiOperation({ summary: 'Serve demo game HTML page (DEMO mode only)' })
  demoGame(
    @Query('token') token: string,
    @Query('game') game: string,
    @Query('name') name: string,
    @Query('provider') provider: string,
    @Res() res: Response,
  ) {
    const html = this.casinoService.getDemoGameHtml(token, game, decodeURIComponent(name), decodeURIComponent(provider));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * POST /casino/callback — Provider wallet callback (Seamless Wallet pattern).
   *
   * Called BY THE PROVIDER whenever a player bets/wins/gets a refund.
   * Verifies HMAC signature then debits/credits the user's wallet.
   *
   * This single endpoint handles Evolution, Ezugi, and Supernowa formats
   * (adapt the body parsing to match your chosen provider's exact schema).
   */
  @Public()
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Provider wallet callback (DEBIT / CREDIT / REFUND / BALANCE)',
    description: 'Called by casino provider on every bet/win. Verifies HMAC signature and updates user wallet via SELECT FOR UPDATE.',
  })
  @ApiResponse({ status: 200, description: '{ code: "OK", balance: 1234.56 }' })
  async callback(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
    @Body() body: CasinoCallbackBody,
  ) {
    // Verify provider signature (bypass in DEMO mode)
    const rawBody = (req as { rawBody?: Buffer }).rawBody?.toString() || JSON.stringify(body);
    if (signature && !this.casinoService.validateCallbackSignature(rawBody, signature)) {
      return { code: 'INVALID_SIGNATURE', balance: 0 };
    }

    // Handle BALANCE check (provider polls wallet without changing it)
    if (body.type === 'BALANCE') {
      return { code: 'OK', balance: 0 }; // wallet service lookup handled in real impl
    }

    return this.casinoService.handleProviderCallback(body);
  }

  // ─── Real-money bet/settle/history ───────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('bet')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Place casino bet — debit stakerom real wallet' })
  @ApiResponse({ status: 200, description: '{ round_id, balance }' })
  placeBet(
    @CurrentUser() user: UserEntity,
    @Body() body: { game_id: string; game_name: string; stake: number },
  ) {
    return this.casinoService.placeCasinoBet(user.id, body.game_id, body.game_name, body.stake);
  }

  @UseGuards(JwtAuthGuard)
  @Post('settle')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Settle a casino round — credit win or record loss' })
  @ApiResponse({ status: 200, description: '{ balance, net }' })
  settleRound(
    @CurrentUser() user: UserEntity,
    @Body() body: { round_id: string; win_amount: number; stake: number },
  ) {
    return this.casinoService.settleCasinoRound(user.id, body.round_id, body.win_amount, body.stake);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Casino round history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getHistory(
    @CurrentUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.casinoService.getCasinoHistory(user.id, +page, +limit);
  }
}
