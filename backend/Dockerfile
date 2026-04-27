# ── Seahawk Backend — Production Dockerfile ──────────────────────────
# Build context: backend/ (Railway root_dir = backend)
# Frontend is pre-built and committed into backend/public/

FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma native engine support on Alpine
RUN apk add --no-cache openssl

# Install production deps
COPY package*.json ./
RUN npm ci --only=production --silent

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy pre-built frontend assets
COPY public ./public

# Copy backend source
COPY src ./src
COPY server.js ./server.js

# Copy NLP model if present (won't fail if missing)
COPY . /tmp/backend-check
RUN if [ -f /tmp/backend-check/model.nlp ]; then cp /tmp/backend-check/model.nlp ./model.nlp; fi && rm -rf /tmp/backend-check

# Create logs dir
RUN mkdir -p logs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
