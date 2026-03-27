# PlayAdda Backend

A **production-ready, real-time betting & trading platform** backend built with NestJS, PostgreSQL, Redis, and WebSocket (Socket.IO).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 6+ *(optional — REST APIs work without it; disables live odds broadcast)*

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

### 3. Start databases (portable, no Docker needed)
```powershell
# Start local portable PostgreSQL
.\pg_portable\pgsql\bin\pg_ctl.exe start -D .\pg_portable\data -l .\pg_portable\pg.log

# Tables are auto-created on first start (DB_SYNC=true in .env)
```

### 4. Start the server
```bash
# Development (watch mode)
npm run start:dev

# Production (pre-built)
npm run build
node dist/main.js
```

### 5. Open Swagger UI
```
http://localhost:3000/api/docs
```

---

## 📡 API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register + auto-create wallet |
| POST | `/api/v1/auth/login` | — | Login → JWT |
| GET | `/api/v1/users/me` | JWT | Get profile |
| PATCH | `/api/v1/users/me` | JWT | Update username |
| GET | `/api/v1/users/referrals` | JWT | Referral list |
| GET | `/api/v1/wallet` | JWT | Wallet balance |
| POST | `/api/v1/wallet/deposit` | JWT | Deposit funds |
| POST | `/api/v1/wallet/withdraw` | JWT | Withdraw funds |
| GET | `/api/v1/wallet/transactions` | JWT | Transaction history |
| POST | `/api/v1/bets/place` | JWT | Place a bet |
| GET | `/api/v1/bets/history` | JWT | Bet history (filterable) |
| GET | `/api/v1/bets/:betId` | JWT | Single bet details |
| GET | `/api/v1/odds/live` | — | Live match odds |
| GET | `/api/v1/odds/:matchId` | — | Match odds |
| GET | `/api/v1/admin/dashboard` | ADMIN | Platform stats |
| GET | `/api/v1/admin/matches` | ADMIN | All matches |
| POST | `/api/v1/admin/matches` | ADMIN | Create match |
| PATCH | `/api/v1/admin/matches/:id/status` | ADMIN | Set match LIVE/SETTLED (auto bulk settle) |
| PUT | `/api/v1/admin/odds/:oddsId` | ADMIN | Update odds prices |
| GET | `/api/v1/admin/bets` | ADMIN | All bets |
| POST | `/api/v1/admin/bets/:betId/settle` | ADMIN | Settle bet |
| POST | `/api/v1/admin/bets/:betId/void` | ADMIN | Void bet (refund) |
| GET | `/api/v1/admin/users` | ADMIN | All users |
| GET | `/api/v1/admin/users/:userId` | ADMIN | User detail |
| PATCH | `/api/v1/admin/users/:userId/toggle-active` | ADMIN | Enable/disable account |
| GET | `/api/v1/admin/users/:userId/wallet` | ADMIN | User wallet |
| POST | `/api/v1/admin/users/:userId/wallet/credit` | ADMIN | Manual wallet credit |

---

## 🔌 WebSocket (Socket.IO)

**Connect:** `ws://localhost:3000`

**Authenticate:** Pass JWT in handshake:
```js
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

| Event (client → server) | Payload | Description |
|--------------------------|---------|-------------|
| `subscribe:match` | `{ matchId: "uuid" }` | Join match room |
| `unsubscribe:match` | `{ matchId: "uuid" }` | Leave match room |

| Event (server → client) | Description |
|--------------------------|-------------|
| `odds:update` | New odds prices for a match |
| `bet:settled` | Your bet was settled |

---

## 🏗️ Architecture

```
src/
├── main.ts                         ← Bootstrap (Swagger, CORS, Helmet, ValidationPipe)
├── app.module.ts                   ← Root module
├── common/
│   ├── decorators/                 ← @CurrentUser, @Roles, @Public
│   ├── filters/                    ← GlobalExceptionFilter
│   ├── guards/                     ← JwtAuthGuard, RolesGuard, WsAuthGuard
│   └── interceptors/               ← TransformInterceptor (std response envelope)
├── config/
│   ├── database.config.ts          ← TypeORM factory (pool size 20)
│   └── redis.service.ts            ← ioredis with graceful disable
└── modules/
    ├── auth/                       ← JWT register/login + referral bonus
    ├── user/                       ← Profile + PATCH /me
    ├── wallet/                     ← SELECT FOR UPDATE balance ops
    ├── betting/                    ← Atomic placeBet + settleBet + voidBet
    ├── odds/                       ← Live odds + Redis pub/sub
    ├── admin/                      ← Match lifecycle + bulk settlement + user mgmt
    └── events/                     ← Socket.IO gateway (Redis subscriber)
```

---

## 🔐 Security
- **Passwords**: bcrypt (cost factor 12)  
- **Authentication**: JWT (HS256, configurable expiry)  
- **Validation**: class-validator `whitelist: true, forbidNonWhitelisted: true`  
- **Rate limiting**: 100 req/min global, 5 req/min on auth routes  
- **HTTP security**: helmet middleware  
- **Roles**: `USER` | `ADMIN` (RolesGuard)  
- **Concurrency**: `SELECT ... FOR UPDATE` on all wallet mutations  

---

## 💰 Wallet Concurrency (Critical Design)

```
placeBet():
  BEGIN TRANSACTION
    SELECT wallet FOR UPDATE          ← row-level exclusive lock
    IF available < stake → THROW 400
    locked_balance += stake           ← funds reserved
    INSERT bets (PENDING)
  COMMIT

settleBet(WIN):
  BEGIN TRANSACTION
    SELECT wallet FOR UPDATE
    balance += payout
    locked_balance -= stake
    UPDATE bets SET status=WON
  COMMIT

settleBet(LOSS):
  BEGIN TRANSACTION
    SELECT wallet FOR UPDATE
    balance -= stake
    locked_balance -= stake
    UPDATE bets SET status=LOST
  COMMIT
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (requires test DB running)
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `playadda` | DB user |
| `DB_PASSWORD` | — | DB password |
| `DB_NAME` | `playadda_db` | DB name |
| `DB_SYNC` | `false` | TypeORM auto-sync (dev only!) |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DISABLED` | `false` | Set true to disable Redis |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |
