import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedHandler, tokenManager } from '../services/api';
import { clearSession, refreshSession, seedCsrfCookie } from '../services/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await refreshSession();
        if (cancelled) return;
        if (!cancelled) setUser(meRes.data);
      } catch {
        if (!cancelled) { clearSession(); setUser(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = () => {
      clearSession();
      setUser(null);
      window.location.replace('/login');
    };
    setUnauthorizedHandler(handler);
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email, password, rememberMe = true) => {
    await seedCsrfCookie();
    const res = await api.post('/auth/login', { email, password, rememberMe });

    const token = res.data?.accessToken;
    if (!token) throw new Error('Login failed — no token received');
    tokenManager.set(token);
    const u = res.data?.user;
    if (!u) throw new Error('Login failed — no user received');
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { void 0; }
    clearSession();
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
      isOwner:   !!user?.isOwner,
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
