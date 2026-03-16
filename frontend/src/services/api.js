// src/services/api.js — Axios client with auto token refresh
// Fix #8.1: API URL from env variable — never hardcoded
// Fix #8.2: 401 interceptor with refresh token retry
// Fix #4: Access token stored in memory (not localStorage) — XSS safe

import axios from 'axios';

// ── Access token in memory (not localStorage → XSS safe) ─────────────────
// Refresh token lives in httpOnly cookie (set by server, invisible to JS)
let _accessToken = null;

export const tokenManager = {
  get:   ()    => _accessToken,
  set:   (tok) => { _accessToken = tok; },
  clear: ()    => { _accessToken = null; },
};

// ── Axios instance ────────────────────────────────────────────────────────
const api = axios.create({
  // VITE_API_URL from .env — falls back to /api (works when served from same origin)
  baseURL:          import.meta.env.VITE_API_URL || '/api',
  timeout:          30_000,
  withCredentials:  true, // Required for httpOnly refresh token cookie
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenManager.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: refresh on 401, retry once ─────────────────────
let _refreshing = false;
let _waitQueue  = [];

function processQueue(error, token = null) {
  _waitQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  _waitQueue = [];
}

api.interceptors.response.use(
  (response) => response.data, // Unwrap .data so callers get clean response

  async (error) => {
    const original = error.config;
    const status   = error.response?.status;

    // ── Auth/refresh endpoints: just reject silently, never loop ─────────
    // AuthContext handles these failures directly — no event needed
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(normalizeError(error));
    }

    // ── Protected API call got 401: try refreshing once ──────────────────
    if (status === 401 && !original._retried) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _waitQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retried = true;
      _refreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.data?.accessToken;
        tokenManager.set(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Refresh failed mid-session → user must log in again
        processQueue(null, null);
        tokenManager.clear();
        // Only fire logout event for mid-session expiry (not during initial load)
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject({ message: 'Session expired. Please log in again.', status: 401 });
      } finally {
        _refreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(err) {
  return {
    message: err.response?.data?.message || err.message || 'Network error',
    status:  err.response?.status,
    errors:  err.response?.data?.errors,
  };
}

export default api;
