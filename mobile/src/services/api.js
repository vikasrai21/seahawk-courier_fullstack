// src/services/api.js
// Almost identical to your web api.js — only token storage changes
// Web used in-memory variable; mobile uses expo-secure-store

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Your Railway backend URL ───────────────────────────────────────────────
const BASE_URL = 'https://seahawk-courierfullstack-production.up.railway.app/api';

export const tokenManager = {
  get:   async () => await SecureStore.getItemAsync('accessToken'),
  set:   async (tok) => await SecureStore.setItemAsync('accessToken', tok || ''),
  clear: async () => await SecureStore.deleteItemAsync('accessToken'),
};

const api = axios.create({
  baseURL:         BASE_URL,
  timeout:         30_000,
  withCredentials: false, // mobile doesn't use cookies
});

// ── Request: attach Bearer token ───────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: unwrap data, handle 401 ─────────────────────────────────────
let _refreshing = false;
let _waitQueue  = [];

function processQueue(error, token = null) {
  _waitQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  _waitQueue = [];
}

api.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const original = error.config;
    const status   = error.response?.status;

    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(normalizeError(error));
    }

    if (status === 401 && !original._retried) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _waitQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retried = true;
      _refreshing       = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = res.data?.data?.accessToken;
        await tokenManager.set(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        processQueue(null, null);
        await tokenManager.clear();
        // Emit logout event — AuthContext listens to this
        authEventEmitter.emit('logout');
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

// Simple event emitter for auth events (no external lib needed)
export const authEventEmitter = {
  _listeners: {},
  on:   (event, fn) => { authEventEmitter._listeners[event] = fn; },
  emit: (event)     => { authEventEmitter._listeners[event]?.(); },
  off:  (event)     => { delete authEventEmitter._listeners[event]; },
};

export default api;
