# Seahawk Backend — Changed Files Only

Drop these files into your existing backend repo, replacing the originals.

## Files in this package
Only files that were **changed or newly created** are included.
All other backend files in your repo remain untouched.

## Steps after dropping in

### 1. Run DB migration (required — new tables & enum)
```bash
npx prisma generate
npx prisma migrate deploy
```
This creates:
- `refresh_tokens` table (persisted logout)
- `client_users` table (client portal)
- `UserRole` enum (replaces plain String)

### 2. Install new dependency
```bash
npm install redis
```

### 3. Add environment variables in Railway
Copy from `.env.example` — all new vars are optional.
Key ones to add for new features:
```
WHATSAPP_TOKEN=...        # auto WhatsApp on delivery
WHATSAPP_PHONE_ID=...
SMTP_HOST=...             # email alerts (RTO, NDR, POD)
SMTP_USER=...
SMTP_PASS=...
BACKUP_S3_BUCKET=...      # daily DB backups
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 4. Add GitHub secret for auto-deploy
In your GitHub repo → Settings → Secrets → `RAILWAY_TOKEN`

## What changed

| File | What changed |
|------|-------------|
| `prisma/schema.prisma` | UserRole enum, RefreshToken model, ClientUser model, new indexes |
| `src/app.js` | CSRF + XSS sanitise middleware, client portal route |
| `src/config/index.js` | Startup validation for all env vars |
| `src/controllers/analytics.controller.js` | Redis caching (5-min TTL) on all 5 endpoints |
| `src/controllers/auth.controller.js` | Real logout with DB token revocation |
| `src/middleware/csrf.middleware.js` | **NEW** — double-submit cookie CSRF protection |
| `src/middleware/sanitise.middleware.js` | **NEW** — global XSS sanitisation |
| `src/routes/auth.routes.js` | Unchanged structure, included for reference |
| `src/routes/client-portal.routes.js` | **NEW** — `/api/portal/*` client self-service API |
| `src/services/auth.service.js` | Persisted & revocable refresh tokens |
| `src/services/notification.service.js` | WhatsApp + email alerts (RTO, NDR, POD, welcome) |
| `src/services/shipment.service.js` | Hooks notifications on every status change |
| `src/utils/cache.js` | **NEW** — Redis cache with in-memory fallback |
| `src/utils/logger.js` | PII redaction (phone, email, address, tokens) |
| `src/utils/scheduler.js` | Token cleanup job + daily DB backup job |
| `src/tests/unit/*.test.js` | **NEW** — 3 new test files |
| `.github/workflows/ci.yml` | **NEW** — runs tests on every PR |
| `.github/workflows/deploy.yml` | **NEW** — auto-deploys to Railway on merge to main |
