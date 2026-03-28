// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { tokenManager, authEventEmitter } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true = checking stored token on startup

  // On app start — check if we have a stored token and fetch user
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res?.data || res);
        }
      } catch {
        await tokenManager.clear();
      } finally {
        setLoading(false);
      }
    }
    restoreSession();

    // Listen for forced logout (401 after refresh fails)
    authEventEmitter.on('logout', () => {
      setUser(null);
      tokenManager.clear();
    });
    return () => authEventEmitter.off('logout');
  }, []);

  async function login(email, password) {
    const res  = await api.post('/auth/login', { email, password });
    const data = res?.data || res;

    // Store tokens
    await tokenManager.set(data.accessToken);
    if (data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    }

    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    await tokenManager.clear();
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  }

  const isAdmin      = user?.role === 'ADMIN';
  const isOpsManager = user?.role === 'OPS_MANAGER';
  const isClient     = user?.role === 'CLIENT';
  const isAgent      = user?.role === 'STAFF';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isOpsManager, isClient, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
