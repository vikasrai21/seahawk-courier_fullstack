# ── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent

COPY frontend/ .
# Uses .env.production automatically
RUN npm run build

# ── Stage 2: Production backend ───────────────────────────────────────────
FROM node:20-alpine AS production

# Security: don't run as root
RUN addgroup -g 1001 -S seahawk && adduser -S seahawk -u 1001

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production --silent

# Generate Prisma client
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Copy backend source
COPY backend/src      ./backend/src
COPY backend/server.js ./backend/server.js

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for logs and backups
RUN mkdir -p logs backups && chown -R seahawk:seahawk /app

USER seahawk

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node server.js"]
