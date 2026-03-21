import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../config/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    if (!this.redisService.isEnabled()) {
      this.logger.warn('Redis disabled — WebSocket real-time odds broadcast is inactive');
      return;
    }
    // Subscribe to all odds update channels using pattern matching
    void this.redisService.psubscribe('odds:*', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message) as { matchId: string; [key: string]: unknown };
        this.server.to(`match:${data.matchId}`).emit('odds:update', data);
        this.logger.verbose(`Broadcast odds update → match:${data.matchId}`);
      } catch (err) {
        this.logger.error('Failed to parse Redis odds message', err);
      }
    });
  }

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized ✓');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client subscribes to live odds for a specific match
   * Event: subscribe:match { matchId: "uuid" }
   */
  @SubscribeMessage('subscribe:match')
  handleSubscribeMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.matchId) return { error: 'matchId is required' };
    void client.join(`match:${data.matchId}`);
    this.logger.verbose(`${client.id} subscribed to match:${data.matchId}`);
    return { status: 'subscribed', matchId: data.matchId };
  }

  /**
   * Client unsubscribes from a match room
   * Event: unsubscribe:match { matchId: "uuid" }
   */
  @SubscribeMessage('unsubscribe:match')
  handleUnsubscribeMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.matchId) return { error: 'matchId is required' };
    void client.leave(`match:${data.matchId}`);
    return { status: 'unsubscribed', matchId: data.matchId };
  }

  /**
   * Broadcast a bet settlement result to a specific user
   */
  emitBetSettled(userId: string, betResult: unknown) {
    this.server.to(`user:${userId}`).emit('bet:settled', betResult);
  }
}
