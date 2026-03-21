# Seahawk Courier — Improvement Changelog (v8.0.0)

## 1. Security

### Refresh Token Persistence & Revocation
- **`src/services/auth.service.js`** — Refresh tokens are now random opaque tokens stored in the `refresh_tokens` DB table (not JWTs). Tokens are revoked on logout, password change, and account deactivation.
- **`src/controllers/auth.controller.js`** — Logout now calls `revokeRefreshToken()` before clearing the cookie. Password change clears the cookie too.
- **`prisma/schema.prisma`** — Added `RefreshToken` model with `userId`, `expiresAt`, `revokedAt`, `ip`, `userAgent`.

### UserRole Enum
- **`prisma/schema.prisma`** — `User.role` is now a Prisma `enum UserRole { ADMIN OPS_MANAGER STAFF CLIENT }`. Prevents invalid roles entering the DB.

### Client User Model
- **`prisma/schema.prisma`** — Added `ClientUser` model linking a `USER` (role=CLIENT) to a `Client` record, enabling the self-service portal.

### XSS Sanitisation
- **`src/middleware/sanitise.middleware.js`** — New middleware strips HTML tags and JS event handlers from all string body fields on every request. Skips password/token fields.
- **`src/app.js`** — `sanitiseBody` middleware applied globally before all routes.

### Auth service hardening
- Role validation on `createUser` — rejects unknown roles
- `updateUser` revokes all tokens when `active` is set to `false`
- `sanitise()` applied to `name` and `branch` fields

### Config Validation
- **`src/config/index.js`** — `JWT_SECRET` now enforces minimum 16-char length. All optional carrier/SMTP keys are grouped clearly. Startup fails fast on missing required vars.

---

## 2. Performance

### React.lazy() Code Splitting
- **`src/App.jsx`** — All 25 app pages are now lazy-loaded with `React.lazy()` + `Suspense`. Public pages load eagerly; app pages only load after authentication. **Estimated bundle size reduction: ~70%** for unauthenticated visitors.

### Debounce Hook
- **`src/hooks/useDebounce.js`** — New hook. Use on all search inputs to prevent firing API calls on every keystroke.

### Scheduler Improvements
- **`src/utils/scheduler.js`** — Added daily `cleanupExpiredTokens()` job at 3am. Added daily DB backup job at 2am. Added NDR escalation check at 9am.

### New DB Indexes
- **`prisma/schema.prisma`** — Added `@@index([courier, status])` on `Shipment` for faster dashboard filter queries.

---

## 3. UX / Frontend

### Keyboard Shortcuts
- **`src/hooks/useKeyboardShortcuts.js`** — New hook. `N`=new entry, `I`=import, `T`=track, `D`=dashboard, `S`=shipments, `/`=focus search, `?`=show help.
- **`src/components/ui/ShortcutsHelp.jsx`** — Modal shown on `?` key listing all shortcuts.

### Empty States
- **`src/components/ui/EmptyState.jsx`** — Reusable empty state component with icon, message, and optional action button. Use in all data tables when results are empty.

---

## 4. New Features

### Client Self-Service Portal
Staff/admin can now create `CLIENT`-role users linked to a client account. Clients get their own portal at `/portal/*`:

- **`src/pages/client/ClientPortalPage.jsx`** — Dashboard with stats
- **`src/pages/client/ClientShipmentsPage.jsx`** — Browse own shipments with search/filter
- **`src/pages/client/ClientInvoicesPage.jsx`** — View and download invoices
- **`src/pages/client/ClientWalletPage.jsx`** — Wallet balance + transaction history
- **`src/pages/client/ClientTrackPage.jsx`** — Track by AWB
- **`src/routes/client-portal.routes.js`** — Backend API `/api/portal/*` — all scoped to the logged-in client's data
- **`prisma/schema.prisma`** — `ClientUser` model links `User.id` → `Client.code`

### WhatsApp Delivery Notifications
- **`src/services/notification.service.js`** — Rewrites notification service. Auto-sends WhatsApp to consignee on `OutForDelivery` and `Delivered` status changes.
- **`src/services/shipment.service.js`** — `updateStatus()` now calls `notifyStatusChange()` and `sendPODEmail()` automatically.
- Configure via `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` env vars (Meta Cloud API).

### Email Notifications
- RTO alert email to client on RTO status
- NDR alert email to client on failed delivery
- POD confirmation email on delivery
- Welcome email for new portal users
- Configure via `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` env vars.

### Automated DB Backups
- **`src/utils/scheduler.js`** — Daily `pg_dump` at 2am uploads to S3/R2.
- Configure via `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

---

## 5. DevOps

### GitHub Actions CI/CD
- **`.github/workflows/ci.yml`** — Runs `vitest` on every push/PR with a real PostgreSQL service container.
- **`.github/workflows/deploy.yml`** — Deploys to Railway on merge to `main` via `RAILWAY_TOKEN` secret.

### New Tests
- **`src/tests/unit/refreshToken.test.js`** — Tests revoked/expired token rejection and `revokeAllUserTokens`
- **`src/tests/unit/notification.test.js`** — Tests graceful no-op when SMTP/WhatsApp not configured
- **`src/tests/unit/wallet.test.js`** — Tests wallet credit logic

---

## 6. SEO

### Meta Tags & Open Graph
- **`src/components/seo/PageMeta.jsx`** — `react-helmet-async`-based component. Sets `<title>`, `<meta description>`, Open Graph, and Twitter Card tags per page.
- **`src/pages/public/LandingPage.jsx`** — Now includes `<PageMeta>` and `<LocalBusinessSchema>`.

### JSON-LD Structured Data
- **`src/components/seo/LocalBusinessSchema.jsx`** — Google-readable `LocalBusiness` schema with address, phone, hours, services, and aggregate rating.

### sitemap.xml + robots.txt
- **`public/sitemap.xml`** — All public pages listed with priority and change frequency.
- **`public/robots.txt`** — Blocks `/app/`, `/portal/`, `/api/` from crawlers. Points to sitemap.

### Frontend Package
- **`frontend-package.json`** — Reference `package.json` for the React/Vite frontend including `react-helmet-async`.

---

## Migration Notes

### Run these after deploying:
```bash
# 1. Generate updated Prisma client (new enum + models)
npx prisma generate

# 2. Create migration for new tables (RefreshToken, ClientUser) + UserRole enum
npx prisma migrate deploy

# 3. Install new frontend dependency
npm install react-helmet-async
```

### Environment variables to add:
See `.env.example` for all new optional variables.

---

## Batch 2 — Remaining Fixes

### Fix 1: alert() → inline errors (LandingPage)
- `calcError` state in `RateCalculator` shows red inline banner instead of blocking `alert()`
- `qqErr` and `cbErr` states in `TrackWidget` for quick quote and callback forms
- All 4 `alert()` calls removed from `LandingPage.jsx`

### Fix 2: useDebounce wired into ShipmentDashboardPage
- `useDebounce(filters.search, 300)` — only fires API call 300ms after user stops typing
- `load()` useCallback dependencies updated to use `debouncedSearch` instead of raw `filters.search`

### Fix 3: Redis caching on analytics (5-min TTL)
- `src/utils/cache.js` — Redis-backed cache with automatic in-memory fallback when Redis unavailable
- All 5 analytics endpoints (`overview`, `couriers`, `clients`, `monthly`, `ndr`) wrapped with `cache.wrap()`
- Cache key includes date range params — different date filters get separate cached results

### Fix 4: Auto "Best Rate" carrier selector in BookPage
- Rate estimates for 5 carriers (Trackon, DTDC, Delhivery, BlueDart, FedEx) shown as clickable cards
- Auto-updates when weight or destination city changes
- Best price badge on cheapest option; selected carrier included in WhatsApp booking message
- Zone auto-detection from destination city (local NCR / north / metro / rest / north-east)

### Fix 5: CSRF protection
- `src/middleware/csrf.middleware.js` — double-submit cookie pattern
- `issueCsrfCookie` issues a `csrf_token` cookie readable by JS
- `validateCsrf` validates `x-csrf-token` header on all mutating requests — skips Bearer-token requests
- `src/services/api.js` — request interceptor auto-reads cookie and attaches `x-csrf-token` header

### Fix 6: PII redaction from Winston logs
- `src/utils/logger.js` — `piiRedact()` format strips sensitive fields from every log entry
- Redacted fields: password, phone, email, address, gst, token, paymentId, ip + 8 more
- Message strings scanned with regex — 10-digit phone numbers → `[PHONE]`, emails → `[EMAIL]`
- Applied to both file and console transports

### Fix 7: PWA — installable app for field agents
- `public/manifest.json` — full PWA manifest with name, icons, shortcuts, theme
- `public/sw.js` — service worker: cache-first for static assets, network-first for API, push notifications
- `src/hooks/usePWA.js` — captures `beforeinstallprompt`, exposes `promptInstall()`
- `src/components/layout/AppLayout.jsx` — shows install banner when app is installable
- `index.html` — PWA meta tags, apple-touch-icon, theme-color
- `src/main.jsx` — registers service worker in production

### Fix 8: Embeddable tracking widget
- `public/embed/tracker.js` — self-contained JS widget, zero dependencies
- Drop-in embed: `<div id="seahawk-tracker"></div><script src=".../embed/tracker.js"></script>`
- Options: `data-theme` (light/dark), `data-brand-color`, `data-awb` (pre-fill), `data-container`
- Shows shipment meta + full timeline with color-coded status badges
- `public/embed/demo.html` — live demo page with copy-paste code snippets

### Fix 9: SSR pre-rendering + manual chunk splitting
- `vite.config.js` — `manualChunks` splits vendor libs, heavy pages into separate cached bundles
- SSG config pre-renders `/`, `/services`, `/contact`, `/track`, `/book` as static HTML
- To activate SSR: `npm i -D vite-plugin-ssg` then replace `vite build` → `vite-ssg build` in Railway

### Migration notes for Batch 2:
```bash
# Install cache dep (Redis client)
npm install redis

# Install SSG for pre-rendering (optional but recommended)
npm install -D vite-plugin-ssg

# Update Railway build command for SSR:
# Old: vite build
# New: vite-ssg build
```

---

## Batch 3 — Polish & Completeness Pass

### EmptyState wired into all data pages
Applied `<EmptyState>` with contextual icons, titles, and "clear filters" action buttons to:
- `ShipmentDashboardPage` — with clear-filters action when filters are active
- `NDRPage` — with clear-search action when search term is set
- `PickupSchedulerPage` — friendly message when no pickups scheduled
- `QuoteHistoryPage` — with clear-search action
- `WalletPage` — for empty transaction history
- `ReconciliationPage` — guides user to upload first invoice
- `UsersPage` — guides admin to create first user

### useDebounce applied to all search inputs
Added 300ms debounce to: `NDRPage`, `QuoteHistoryPage`, `WalletPage`, `ClientsPage` (in addition to `ShipmentDashboardPage` from Batch 2). All search inputs across the entire app now debounce.

### All alert() calls removed — zero remaining
Fixed `ContactPage` (both `/contact` and `/pages/public/ContactPage`) — replaced with `formError` inline state.

### localStorage → sessionStorage for UI preferences
`RateCalculatorPage` hidden-courier preference moved from `localStorage` to `sessionStorage` (cleared on tab close, not a security risk but cleaner).

### ErrorBoundary component
- `src/components/ui/ErrorBoundary.jsx` — class component catching render errors with "Try again" UI
- Wraps entire `<Suspense>` tree in `App.jsx` — any lazy chunk crash shows friendly error instead of blank white screen

### Final counts
- **50 files** modified or added vs original
- **37 routes** lazy-loaded
- **20 files** using EmptyState
- **7 files** using useDebounce
- **5 analytics endpoints** Redis-cached
- **0 alert() calls** remaining
- **0 localStorage** auth/sensitive references
