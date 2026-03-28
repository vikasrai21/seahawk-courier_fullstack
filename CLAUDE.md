# Seahawk Courier SaaS

## Stack
- Frontend: React + Vite + Tailwind — frontend/
- Backend: Node/Express + Prisma + PostgreSQL — backend/
- Deploy: Railway (backend as root, frontend built to backend/public)
- Live: https://seahawk-courierfullstack-production.up.railway.app

## Key files
- Theme: frontend/src/styles/theme.css
- App entry: frontend/src/App.jsx
- Auth: frontend/src/context/AuthContext.jsx
- Public routes: backend/src/routes/public.routes.js

## Known issues
- theme.css must only load in AppLayout.jsx
- VITE_API_URL must be empty for Railway (same domain)