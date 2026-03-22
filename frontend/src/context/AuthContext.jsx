import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api, { tokenManager } from '../services/api';

const AuthContext = createContext(null);

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const csrf = getCookie('csrf_token');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrf ? { 'x-csrf-token': csrf } : {},
          }
        );
        if (cancelled) return;
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error('No token');
        tokenManager.set(token);
        const meRes = await api.get('/auth/me');
        if (!cancelled) setUser(meRes.data);
      } catch {
        if (!cancelled) { tokenManager.clear(); setUser(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => {
      tokenManager.clear();
      setUser(null);
      window.location.replace('/login');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    // Seed CSRF cookie first via a GET request
    try {
      await axios.get(
        `${import.meta.env.VITE_API_URL || '/api'}/health`,
        { withCredentials: true }
      );
    } catch {}

    // Read the csrf_token cookie that was just set
    const csrf = getCookie('csrf_token');

    // Now do the actual login with CSRF header
    const res = await api.post('/auth/login', { email, password }, {
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    });

    const token = res.data?.accessToken;
    if (!token) throw new Error('Login failed — no token received');
    tokenManager.set(token);
    const u = res.data?.user;
    if (!u) throw new Error('Login failed — no user received');
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    tokenManager.clear();
    setUser(null);
  }, []);

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.flat().includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isAdmin:   user?.role === 'ADMIN',
      isStaff:   user?.role === 'STAFF',
      isOps:     user?.role === 'OPS_MANAGER',
      isClient:  user?.role === 'CLIENT',
      canManage: ['ADMIN', 'OPS_MANAGER'].includes(user?.role),
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
