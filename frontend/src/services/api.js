import axios from 'axios';

let _accessToken = null;

export const tokenManager = {
  get:   ()    => _accessToken,
  set:   (tok) => { _accessToken = tok; },
  clear: ()    => { _accessToken = null; },
};

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  timeout:         30_000,
  withCredentials: true,
});

// Request: attach token
api.interceptors.request.use((config) => {
  const token = tokenManager.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: unwrap to response.data.data when success, else response.data
let _refreshing = false;
let _waitQueue  = [];

function processQueue(error, token = null) {
  _waitQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  _waitQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Return the full { success, message, data, pagination } object
    // Pages access res.data for the payload
    return response.data;
  },

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
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // res.data is { success, message, data: { accessToken } }
        const newToken = res.data?.data?.accessToken;
        tokenManager.set(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        processQueue(null, null);
        tokenManager.clear();
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