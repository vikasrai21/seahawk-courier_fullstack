# Seahawk Courier & Cargo — Operations Platform

> Full-stack logistics management system for courier aggregators — built for the Indian B2B market.

[![CI](https://github.com/your-org/seahawk/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/seahawk/actions)
[![Node](https://img.shields.io/badge/node-20.x-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Private-red)](#)

---

## What is this?

Seahawk is a production-ready courier operations platform that lets a logistics business manage its entire shipment lifecycle — from booking and tracking to invoicing, NDR resolution, and client self-service — in one place.

It integrates with major Indian carriers (Delhivery, DTDC, Trackon, BlueDart, DHL) and exposes a white-label client portal that each client company can use independently.

---

## Features at a glance

### Operations (Staff / Admin)
- **Shipment management** — create, update, bulk import via Excel, scan AWB via barcode
- **Live tracking** — auto-sync with carrier APIs, manual event logging, real-time updates via Socket.IO
- **NDR management** — non-delivery reason capture, reattempt actions, escalation rules
- **Pickup scheduler** — assign agents, manage time slots, track completion
- **Rate calculator** — multi-carrier cost vs. sell price with margin rule enforcement
- **Bulk rate comparison** — compare costs across carriers for a destination/weight combination
- **Reconciliation** — match courier invoices against booked shipments, flag discrepancies
- **Daily sheet & monthly reports** — printable operations summaries
- **WhatsApp notifications** — automated status updates via Meta Cloud API
- **Audit trail** — every create/update/delete logged with user, IP, before/after values

### Client Portal (`/portal/*`)
- Shipment visibility with live tracking map
- Branded public tracking page (white-labelled per client)
- Bulk AWB tracking
- Pickup booking from portal
- NDR self-service — clients can request reattempts or address changes
- Invoice download (PDF)
- Wallet top-up via Razorpay + full transaction ledger
- POD (proof of delivery) download
- Support ticket system
- Rate calculator (client-facing, selling price only)
- RTO intelligence — delivery risk scoring per shipment
- Embeddable tracking widget (drop a `<script>` on any external site)

### Public Website
- Landing page, services, contact form
- Public shipment tracking (rate-limited)
- Booking request form

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, Prisma ORM, PostgreSQL 16 |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.IO client |
| Auth | JWT (access 15m) + opaque refresh tokens (30d) with DB revocation |
| Queue | BullMQ + Redis |
| Real-time | Socket.IO with Redis adapter |
| Validation | Zod (all API inputs) |
| Logging | Winston — structured JSON, PII-redacted |
| File storage | AWS S3 / Cloudflare R2 (labels, invoices, PODs) |
| Payments | Razorpay |
| Notifications | WhatsApp (Meta Cloud API), SMTP email |
| Monitoring | Sentry, custom metrics middleware |
| Deployment | Railway |
| CI/CD | GitHub Actions |

---

## Architecture

```
seahawk/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Single source of truth for DB schema
│   │   └── migrations/            # Versioned SQL migrations
│   └── src/
│       ├── config/                # Central config, Prisma client, Sentry
│       ├── controllers/           # HTTP layer — thin, delegates to services
│       ├── services/              # Business logic — shipment, invoice, wallet …
│       ├── routes/                # Route definitions with middleware chains
│       ├── middleware/            # Auth, RBAC, rate limiting, CSRF, sanitise, metrics
│       ├── validators/            # Zod schemas for every input
│       ├── workers/               # BullMQ job processors
│       ├── realtime/              # Socket.IO event handlers
│       └── utils/                 # Logger, response helpers, seed, scheduler
├── frontend/
│   └── src/
│       ├── components/            # Reusable UI components + layout
│       ├── context/               # AuthContext, SocketContext, ThemeContext
│       ├── features/              # Feature-scoped components (rate calculator)
│       ├── hooks/                 # useFetch, useDebounce, useToast, usePWA …
│       ├── pages/                 # All app pages (ops + client portal + public)
│       ├── services/              # Axios API client
│       └── stores/                # Zustand state (dataStore, uiStore)
├── .github/workflows/ci.yml       # GitHub Actions CI/CD pipeline
├── Dockerfile                     # Railway build container
└── railway.toml                   # Railway deployment config
```

---

## Roles & permissions

| Feature | STAFF | OPS\_MANAGER | ADMIN | CLIENT |
|---|:---:|:---:|:---:|:---:|
| View / create / edit shipments | ✅ | ✅ | ✅ | — |
| Manage clients | ✅ | ✅ | ✅ | — |
| Rate calculator & quotes | ✅ | ✅ | ✅ | ✅ |
| View analytics & reports | ✅ | ✅ | ✅ | — |
| Reconciliation | — | ✅ | ✅ | — |
| Manage users | — | — | ✅ | — |
| View audit logs | — | — | ✅ | — |
| Client portal access | — | — | — | ✅ |

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (required for job queues)
- Python 3.10+ (for free local OCR engine)
- Git

### 1. Clone and install

```bash
git clone https://github.com/your-org/seahawk.git
cd seahawk

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values. The required fields are:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/seahawk
JWT_SECRET=<minimum 32 random characters>
JWT_REFRESH_SECRET=<different minimum 32 random characters>
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

See `.env.example` for the full list of optional carrier API keys, SMTP, Razorpay, S3, and Sentry config.

### 2.1 Enable free local OCR (recommended)

```bash
cd backend
npm run ocr:local:setup
```

This installs `rapidocr-onnxruntime` + `zxing-cpp` for scanner OCR/barcode extraction without Gemini quotas.

### 3. Run database migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Seed initial admin user

```bash
npm run db:seed
```

> ⚠️ **Change the seeded admin password immediately after first login.**

### 5. Start development servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev        # Runs on :3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev        # Runs on :5173, proxies API to :3001
```

Open `http://localhost:5173`.

---

## Production deployment (Railway)

Seahawk is now standardized on Railway for production hosting and database/runtime services.

1. Push to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Add a **PostgreSQL** plugin and a **Redis** plugin from the Railway dashboard
4. Set environment variables (Railway injects `DATABASE_URL` and `REDIS_URL` automatically from the plugins)
5. Add remaining secrets: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN`
6. Railway runs `npm run build` then `npm start` — migrations run automatically via `prisma migrate deploy` in the build step

Health check endpoint: `GET /api/health` — returns `database: connected` when PostgreSQL is reachable; `redis` is `connected`, `not_configured`, `unavailable`, or `error` depending on `REDIS_URL` and the Redis client state.

### Sync local DB to Railway DB (make dashboard data match)

When local and Railway show different numbers, they are usually connected to different databases.

1. Install PostgreSQL CLI tools so `pg_dump`, `psql`, and `pg_restore` are available in PATH.
2. Set environment variables in your terminal:
   - `LOCAL_DATABASE_URL` = your local Postgres URL
   - `RAILWAY_DATABASE_URL` = your Railway Postgres URL
3. Run:
   - `npm run db:sync:local-to-railway`

This replaces the Railway `public` schema with your local data (source of truth = local).

---

## CI/CD pipeline

Every push to `main` or `develop` runs:

```
Lint (backend + frontend)
  → Backend tests (Vitest)
    → Frontend smoke test
      → Frontend build + bundle budget check
        → E2E tests (Playwright: public home, health API, staff + client login)
          → Health check against deployed environment
```

Local E2E (requires PostgreSQL, Redis, env vars as in Getting started, plus demo users: `cd backend && node src/utils/bootstrap-users.js --restore-demo`): start backend and frontend dev servers, then from the repo root run `npm ci`, `npx playwright install chromium`, and `npm run test:e2e`.

- `develop` branch → auto-deploys to staging
- `main` branch → auto-deploys to production

---

## API overview

All responses follow a consistent envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "...", "errors": [ ... ] }
```

Interactive API docs (Swagger UI): `GET /api/docs`
OpenAPI JSON spec: `GET /api/docs/openapi.json`

Key route groups:

| Prefix | Description |
|---|---|
| `POST /api/auth/login` | Login, logout, refresh token, change password |
| `GET/POST /api/shipments` | Shipment CRUD, bulk import, status updates |
| `GET/POST /api/clients` | Client management |
| `GET/POST /api/invoices` | Invoice generation and PDF export |
| `GET/POST /api/wallet` | Wallet top-up, ledger, Razorpay webhook |
| `GET/POST /api/quotes` | Rate quotes and history |
| `GET/POST /api/pickup` | Pickup request scheduling |
| `GET/POST /api/ndr` | NDR event capture and resolution |
| `GET /api/tracking/:awb` | Live tracking (public, rate-limited) |
| `GET /api/analytics` | Dashboard stats and monthly reports |
| `GET /api/audit` | Audit log (admin only) |
| `POST /api/webhooks/*` | Carrier webhook receivers (HMAC-verified) |

---

## Live Excel / Sheet Sync (No Local Script)

Use this when your Excel is on another computer and your backend is on Railway.

1. Set this backend env var:
`INTEGRATION_SYNC_API_KEY=<long-random-secret>`

2. Use this endpoint from Power Automate / Google Apps Script:
`POST /api/public/integrations/excel/import`

3. Send header:
`x-sync-key: <INTEGRATION_SYNC_API_KEY>`

4. Request body format:
```json
{
  "shipments": [
    {
      "date": "2026-04-07",
      "clientCode": "ABC",
      "awb": "123456789012",
      "consignee": "John",
      "destination": "Mumbai",
      "weight": 1.2,
      "amount": 120,
      "courier": "Trackon",
      "department": "OPS",
      "service": "Standard",
      "status": "Booked",
      "remarks": ""
    }
  ]
}
```

5. Import behavior:
- If `courier` is blank, Seahawk tries to auto-detect it from the AWB.
- Imported active shipments are queued for background tracking sync immediately after import.
- The API response includes `trackingQueued` so your automation can log how many AWBs started tracking.

6. Ready-made Google Apps Script:
- Use [google-apps-script-sync.gs](c:\Users\hp\OneDrive\Desktop\seahawk-full_stack\scripts\google-apps-script-sync.gs)
- Paste it into Google Apps Script, set your backend URL and `INTEGRATION_SYNC_API_KEY`, then run it manually or via a time trigger every 5 minutes.

Notes:
- This endpoint is API-key protected and audit-logged (`INTEGRATION_IMPORT`).
- Use your Railway backend base URL (for example `https://<service>.up.railway.app`).
- Best practice is to sync changed rows every 1-5 minutes.

---

## Security

- **Authentication** — JWT access tokens (15 min) + opaque refresh tokens (30 days) stored in the DB with revocation support
- **RBAC** — four roles with middleware-enforced access on every route
- **Rate limiting** — login: 5 req/15 min · API: 300 req/15 min · sensitive actions: 3 req/hr · public tracking: 20 req/hr
- **Input validation** — Zod schemas on all API inputs; unknown fields are stripped
- **CSRF** — double-submit cookie pattern for cookie-based auth sessions
- **XSS** — global body sanitiser strips HTML tags from all string fields
- **Logging** — PII fields (password, phone, email, address, tokens) are redacted from all log output
- **Webhooks** — HMAC-SHA256 signature validation + 300-second replay window
- **Helmet** — security headers including CSP in production

---

## Environment variables reference

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing key (min 32 chars) |
| `REDIS_URL` | ✅ | Redis connection string (for BullMQ) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | — | HTTP port, default `3001` |
| `CORS_ORIGIN` | — | Comma-separated allowed origins |
| `OCR_ENGINE` | — | `local` (default), `auto`, or `gemini` |
| `OCR_PYTHON_BIN` | — | Python executable path for local OCR (default `python`) |
| `OCR_LOCAL_TIMEOUT_MS` | — | Timeout for local OCR process (default `60000`) |
| `GEMINI_API_KEY` | — | Optional Gemini fallback when `OCR_ENGINE=auto/gemini` |
| `SMTP_HOST/USER/PASS` | — | Email notifications |
| `WHATSAPP_TOKEN` | — | Meta Cloud API for WhatsApp updates |
| `DELHIVERY_API_KEY` | — | Delhivery carrier integration |
| `DTDC_API_KEY` | — | DTDC carrier integration |
| `RAZORPAY_KEY_ID/SECRET` | — | Wallet top-up payments |
| `BACKUP_S3_BUCKET` | — | S3/R2 bucket for database backups |
| `SENTRY_DSN` | — | Error monitoring |

---

## Contributing

1. Branch off `develop` — never commit directly to `main`
2. Run `npm run lint` and `npm test` before pushing
3. PR titles should follow: `feat:`, `fix:`, `chore:`, `refactor:`
4. CI must pass before merging

---

## License

Private and proprietary. All rights reserved — Seahawk Courier & Cargo.
