FROM node:20-alpine

WORKDIR /app

# Install frontend deps and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --silent

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production --silent

# Generate Prisma client
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Copy backend source
COPY backend/src ./backend/src
COPY backend/server.js ./backend/server.js

# Create logs dir
RUN mkdir -p logs

EXPOSE 3001

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node server.js"]