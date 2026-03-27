import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../modules/user/entities/user.entity';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      // Allow unauthenticated connections for public odds streaming
      // Authenticated events (like bet updates) require auth
      return true;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (user) {
        // Attach user to socket data for later access
        client.data.user = user;
        // Join personal room for user-specific events
        void client.join(`user:${user.id}`);
      }
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
    }

    return true; // Always allow — auth just populates client.data.user
  }

  private extractToken(client: Socket): string | null {
    // Try auth header first
    const auth = client.handshake.auth?.token as string | undefined;
    if (auth) return auth.replace('Bearer ', '');

    // Fall back to query param
    const query = client.handshake.query?.token as string | undefined;
    if (query) return query;

    // Try headers
    const header = client.handshake.headers?.authorization as string | undefined;
    if (header) return header.replace('Bearer ', '');

    return null;
  }
}
