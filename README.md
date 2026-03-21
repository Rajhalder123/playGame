# Playadda — Monorepo

A full-stack real-time betting/trading platform.

```
playadda/
├── playadda-frontend/   → Next.js 16 app (React + Tailwind CSS)
└── playadda-backend/    → NestJS app (PostgreSQL + Redis + WebSockets)
```

---

## Getting Started

### Frontend

```bash
cd playadda-frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd playadda-backend
npm install
npm run start:dev
# → http://localhost:3001
```

> Make sure to copy `.env.example` → `.env` in `playadda-backend/` and fill in your environment variables before starting the backend.

---

## Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS 4      |
| Backend   | NestJS, TypeScript, PostgreSQL, Redis     |
| Real-time | WebSockets (Socket.IO)                    |
| Auth      | JWT + Passport.js                         |
| DevOps    | Docker Compose                            |
