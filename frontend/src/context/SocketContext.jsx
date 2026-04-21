import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenManager } from '../services/api';
import { refreshSession } from '../services/session';

const SocketContext = createContext({ socket: null, connected: false });

function resolveSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) {
    return window.location.origin;
  }

  return apiUrl.replace(/\/api\/?$/, '');
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return undefined;

    const getAuthPayload = () => ({ token: tokenManager.get() });
    if (!getAuthPayload().token) return undefined;

    const instance = io(resolveSocketUrl(), {
      autoConnect: false,
      auth: getAuthPayload,
      withCredentials: true,
    });

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.io.on('reconnect_attempt', () => {
      instance.auth = getAuthPayload;
    });
    instance.on('connect_error', async (err) => {
      const message = String(err?.message || '').toLowerCase();
      if (!message.includes('unauthorized')) return;
      try {
        await refreshSession();
        instance.auth = getAuthPayload;
        if (!instance.connected) instance.connect();
      } catch {
        setConnected(false);
      }
    });

    setSocket(instance);
    instance.connect();

    return () => {
      instance.close();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
