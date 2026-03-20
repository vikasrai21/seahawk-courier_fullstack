// AuthContext.jsx — Updated for two-step OTP login
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { tokenManager } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on page load ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (cancelled) return;
        const token = res.data?.accessToken || res.accessToken;
        if (!token) throw new Error('No token');
        tokenManager.set(token);
        const meRes = await api.get('/auth/me');
        if (cancelled) return;
        setUser(meRes.data || meRes);
      } catch {
        if (!cancelled) { tokenManager.clear(); setUser(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  // ── Mid-session expiry ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      tokenManager.clear();
      setUser(null);
      window.location.replace('/login');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Login — handles both old style and new OTP style ────────────────────
  // For OTP login: call with (null, null, { email, otp })
  // For direct login (internal): call with (email, password)
  const login = useCallback(async (email, password, otpPayload) => {
    let token, userData;

    if (otpPayload) {
      // Step 2: OTP verification
      const res = await api.post('/auth/verify-otp', otpPayload);
      const data = res.data || res;
      token    = data.accessToken;
      userData = data.user;
      if (!token) throw new Error('No access token received');
      tokenManager.set(token);
      setUser(userData);
      return { ...userData, mustChangePassword: data.mustChangePassword };
    } else {
      // Legacy direct login (used by client portal which has separate flow)
      const res = await api.post('/auth/login', { email, password });
      const data = res.data || res;
      token    = data.accessToken;
      userData = data.user;
      if (!token) throw new Error('No access token received');
      tokenManager.set(token);
      setUser(userData);
      return userData;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    tokenManager.clear();
    setUser(null);
  }, []);

  const isAdmin  = user?.role === 'ADMIN';
  const hasRole  = (...roles) => {
    if (!user) return false;
    return roles.flat().includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
