// src/context/AuthContext.jsx — Clean auth with no redirect loops
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { tokenManager } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On page load: try to restore session via refresh token cookie ────────
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        // Try to get a new access token using the httpOnly refresh cookie
        const res = await api.post('/auth/refresh');
        if (cancelled) return;
        const token = res.data?.accessToken;
        if (!token) throw new Error('No token');
        tokenManager.set(token);

        // Get user profile
        const meRes = await api.get('/auth/me');
        if (cancelled) return;
        setUser(meRes.data);
      } catch {
        // No session or expired — just show login page, no redirect loop
        if (!cancelled) {
          tokenManager.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  // ── Listen for mid-session expiry (fired by api.js interceptor) ──────────
  // Only fires when a protected call fails AFTER login — never on initial load
  useEffect(() => {
    const handler = () => {
      tokenManager.clear();
      setUser(null);
      // Use replace so back button doesn't loop
      window.location.replace('/login');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data?.accessToken;
    if (!token) throw new Error('No access token received');
    tokenManager.set(token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
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
      user,
      loading,
      login,
      logout,
      isAdmin:     user?.role === 'ADMIN',
      isStaff:     user?.role === 'STAFF',
      isOps:       user?.role === 'OPS_MANAGER',
      isCustomer:  user?.role === 'CLIENT',
      isWarehouse: user?.role === 'WAREHOUSE',
      canManage:   ['ADMIN','OPS_MANAGER'].includes(user?.role),
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
