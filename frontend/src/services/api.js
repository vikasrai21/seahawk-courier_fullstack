import axios from 'axios';

let _accessToken = null;
let _persistToken = false;
const TOKEN_KEY = 'shk_access_token';
const PERSIST_KEY = 'shk_remember';
const hasStorage = typeof window !== 'undefined' && !!window.localStorage;

if (hasStorage) {
  _persistToken = window.localStorage.getItem(PERSIST_KEY) === '1';
  if (_persistToken) {
    _accessToken = window.localStorage.getItem(TOKEN_KEY) || null;
  }
}
let _logoutHandler = null;

export const tokenManager = {
  get: () => {
    if (_accessToken) return _accessToken;
    if (_persistToken && hasStorage) {
      _accessToken = window.localStorage.getItem(TOKEN_KEY) || null;
    }
    return _accessToken;
  },
  set: (tok, persist = undefined) => {
    if (persist !== undefined) _persistToken = !!persist;
    _accessToken = tok;
    if (hasStorage) {
      if (_persistToken && tok) {
        window.localStorage.setItem(TOKEN_KEY, tok);
        window.localStorage.setItem(PERSIST_KEY, '1');
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.setItem(PERSIST_KEY, '0');
      }
    }
  },
  clear: () => {
    _accessToken = null;
    _persistToken = false;
    if (hasStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.setItem(PERSIST_KEY, '0');
    }
  },
  setRemember: (persist) => {
    _persistToken = !!persist;
    if (hasStorage) {
      window.localStorage.setItem(PERSIST_KEY, _persistToken ? '1' : '0');
      if (!_persistToken) window.localStorage.removeItem(TOKEN_KEY);
    }
  },
};

export function setUnauthorizedHandler(handler) {
  _logoutHandler = handler;
}

const api = axios.create({
  baseURL:     import.meta.env.VITE_API_URL || '/api',
  timeout:     30_000,
  withCredentials: true,
});

// ── Helper: read a cookie by name ──────────────────────────────────────────
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// ── Request: attach Bearer token + CSRF header ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenManager.get();
  const csrf = getCookie('csrf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (csrf) config.headers['x-csrf-token'] = csrf;
  return config;
});

// ── Response: unwrap data, handle 401 with token refresh ──────────────────
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
      _refreshing = true;

      try {
        // Refresh call — uses cookie auth, so must include CSRF header
        const csrf = getCookie('csrf_token');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrf ? { 'x-csrf-token': csrf } : {},
          }
        );

        const newToken = res.data?.data?.accessToken;
        if (!newToken) throw new Error('Refresh did not return an access token');
        tokenManager.set(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        processQueue(null, null);
        tokenManager.clear();
        _logoutHandler?.();
        return Promise.reject({ message: 'Session expired. Please log in again.', status: 401 });
      } finally {
        _refreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(err) {
  const incidentId = err.response?.data?.incidentId || err.response?.headers?.['x-request-id'] || null;
  return {
    message: err.response?.data?.message || err.message || 'Network error',
    status:  err.response?.status,
    errors:  err.response?.data?.errors,
    incidentId,
  };
}

export default api;
