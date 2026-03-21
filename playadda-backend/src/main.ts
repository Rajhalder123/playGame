import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose'],
  });

  // ── Security ─────────────────────────────────────────────────────
  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global Validation Pipe ────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');

  // ── Swagger Docs ──────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PlayAdda API')
      .setDescription(
        `## Real-time Betting & Trading Platform API

### Authentication
Use **Bearer JWT** token. Get one from \`POST /auth/login\`.

### WebSocket
Connect to \`ws://localhost:3000\` (Socket.IO).
- Emit: \`subscribe:match\` → \`{ matchId: "uuid" }\`
- Listen: \`odds:update\`, \`bet:settled\``,
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      .addTag('Auth', 'Register & Login')
      .addTag('Users', 'Profile & referrals')
      .addTag('Wallet', 'Balance, deposits, withdrawals, transactions')
      .addTag('Bets', 'Place bets & view history')
      .addTag('Odds', 'Live match odds (public)')
      .addTag('Admin', 'Admin-only operations (ADMIN role required)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
      customSiteTitle: 'PlayAdda API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><text y="22" font-size="20" font-weight="bold" fill="%23c6ff00">PlayAdda</text></svg>'); }
      `,
    });

    console.log(`📚 Swagger UI: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 PlayAdda Backend running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Environment: ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
