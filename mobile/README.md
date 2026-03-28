# Seahawk Mobile

React Native (Expo) mobile app for Seahawk Courier & Cargo.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Scan QR code with Expo Go app on your phone
```

## Structure

```
mobile/
├── App.jsx                    # Root — navigation setup
├── src/
│   ├── services/api.js        # Axios — talks to Railway backend
│   ├── context/AuthContext.jsx# JWT auth state
│   └── screens/
│       ├── LoginScreen.jsx
│       ├── DashboardScreen.jsx
│       ├── ShipmentsScreen.jsx
│       ├── TrackScreen.jsx
│       └── ProfileScreen.jsx
```

## Backend
Points to: https://seahawk-courierfullstack-production.up.railway.app/api
No backend changes needed — reuses the same API as the web app.
