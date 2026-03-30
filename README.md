# 🦅 Seahawk Courier & Cargo v2.0 — Production Ready

## What's New in v2.0
This is a **complete rewrite** from the ground up with production-grade architecture.

| Feature | v1 (Old) | v2 (New) |
|---------|----------|----------|
| Frontend | Static HTML | React + Vite + Tailwind |
| Backend | Flat routes | Controllers → Services → DB |
| Database | Raw SQL | Prisma ORM with migrations |
| Auth | None | JWT + bcrypt + role-based |
| Validation | None | Zod schema validation |
| Error handling | Inconsistent | Global error handler |
| Audit trail | None | Full audit logs table |
| Backups | Manual | Auto daily via Task Scheduler |
| Multi-computer | Same LAN only | LAN + Cloud ready |

---

## Architecture

```
seahawk-v6/
├── backend/
│   ├── src/
│   │   ├── config/         — Central config, Prisma client
│   │   ├── controllers/    — HTTP layer (auth, shipment, client, audit)
│   │   ├── services/       — Business logic
│   │   ├── routes/         — Route definitions with middleware
│   │   ├── middleware/     — Auth, validation, global error handler
│   │   ├── validators/     — Zod schemas for all inputs
│   │   └── utils/          — Logger, response helpers, audit, seed
│   ├── prisma/
│   │   └── schema.prisma   — Single source of truth for DB
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/     — Reusable UI + layout
│       ├── context/        — AuthContext (user state)
│       ├── hooks/          — useFetch, useToast
│       ├── pages/          — All pages (Dashboard, Shipments, etc.)
│       └── services/       — API client (axios)
└── scripts/
    └── seahawk-backup.bat  — Daily backup
```

---

## Quick Start (Windows)

### Step 1 — Run setup (once)
```
Double-click: setup-windows.bat
```
This installs all dependencies, creates the database, runs migrations, and creates the admin user.

### Step 2 — Configure
Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/seahawk_v6"
JWT_SECRET="put-any-long-random-string-here-minimum-32-chars"
NODE_ENV=production
PORT=3001
GLOBAL_JSON_LIMIT=1mb
IMPORT_JSON_LIMIT=10mb
DELHIVERY_WEBHOOK_SECRET=""
DTDC_WEBHOOK_SECRET=""
WEBHOOK_REPLAY_WINDOW_SECONDS=300
```

### Step 3 — Start
```
Double-click: start-seahawk.bat
```

### Step 4 — Open
- This computer: http://localhost:3001
- Other computers: http://YOUR_LAN_IP:3001 (shown in console)

Default login: **admin@seahawk.com** / ****
> ⚠️ Change the password after first login!

---

## Running the React Frontend (Development)

For development, run backend and frontend separately:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on :3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on :5173 with proxy to :3001
```

**Building for production:**
```bash
cd frontend
npm run build
# Output goes to frontend/dist/
# Backend serves this automatically
```

---

## Roles & Permissions

| Feature | STAFF | ADMIN |
|---------|-------|-------|
| View/Add/Edit Shipments | ✅ | ✅ |
| Manage Clients | ✅ | ✅ |
| View Reports | ✅ | ✅ |
| Manage Users | ❌ | ✅ |
| View Audit Logs | ❌ | ✅ |
| Delete All Data | ❌ | ✅ |

---

## API Reference

All API responses follow:
```json
{ "success": true, "message": "...", "data": {...} }
{ "success": false, "message": "...", "errors": [...] }
```

Interactive OpenAPI docs:
- `GET /api/docs` (Swagger UI)
- `GET /api/docs/openapi.json` (raw OpenAPI spec)

Production docs access can be controlled with:
```env
API_DOCS_ENABLED=true
API_DOCS_PUBLIC=false
```

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET  /api/auth/me` — Current user
- `GET  /api/auth/users` — All users (admin)
- `POST /api/auth/users` — Create user (admin)
- `PUT  /api/auth/users/:id` — Update user (admin)

### Shipments
- `GET  /api/shipments` — List with filters (client, courier, status, date_from, date_to, q)
- `POST /api/shipments` — Create
- `GET  /api/shipments/:id` — Single
- `PUT  /api/shipments/:id` — Update
- `PATCH /api/shipments/:id/status` — Quick status update
- `DELETE /api/shipments/:id` — Delete
- `POST /api/shipments/import` — Bulk import
- `GET  /api/shipments/stats/today` — Today's stats
- `GET  /api/shipments/stats/monthly?year=2025&month=3` — Monthly data

Body-size policy:
- Global JSON body limit is `1mb`
- `/api/shipments/import` has a route-specific higher limit (`IMPORT_JSON_LIMIT`, default `10mb`)

### Clients
- `GET  /api/clients` — All clients
- `POST /api/clients` — Create/update client
- `GET  /api/clients/:code` — Single client
- `GET  /api/clients/:code/stats` — Client statistics
- `DELETE /api/clients/:code` — Delete client

### Audit
- `GET /api/audit` — Audit logs (admin only, filters: entity, userId, action, from, to)

---

## Automatic Backup Setup (Windows Task Scheduler)

1. Edit `scripts/seahawk-backup.bat` — replace `YOUR_DB_PASSWORD` with your postgres password
2. Open Task Scheduler (Win+R → `taskschd.msc`)
3. Create Basic Task → Daily → set time → Action: Start a Program
4. Program: `C:\path\to\seahawk-v6\scripts\seahawk-backup.bat`
5. Backups saved to `seahawk-v6/backups/` (keeps last 30 days)

Manual backup: `pg_dump -U postgres seahawk_v6 > backup.sql`
Restore: `psql -U postgres seahawk_v6 < backup.sql`

---

## Cloud Deployment (Railway/Render)

1. Push code to GitHub
2. Create account on railway.app or render.com
3. New project → Deploy from GitHub
4. Add PostgreSQL database plugin
5. Set environment variables from the database panel:
   - `DATABASE_URL` (provided by platform)
   - `JWT_SECRET` (generate a random string)
   - `NODE_ENV=production`
6. Deploy → get public URL

For Railway: run `npx prisma migrate deploy` as a pre-deploy command.

---

## Migrating Data from v1

1. In old dashboard → Sync & Backup → Export to Excel
2. In new dashboard → Import Excel → upload the file
3. All data imported, duplicates skipped automatically

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot connect to database` | Check DB_PASSWORD in .env, ensure PostgreSQL is running |
| `Token expired` | Re-login. Tokens last 7 days. |
| `Validation failed` | Check the errors array in the response |
| `Duplicate AWB` | AWB already exists — each AWB must be unique |
| `Port 3001 in use` | Change PORT in .env |

Logs are in `backend/logs/` folder.
