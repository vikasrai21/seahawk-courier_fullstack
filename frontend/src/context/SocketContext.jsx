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
    if (!user) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    let cancelled = false;
    let instance = null;

    const getAuthPayload = () => ({ token: tokenManager.get() });
    const connectSocket = async () => {
      let token = getAuthPayload().token;
      if (!token) {
        try {
          await refreshSession();
          token = tokenManager.get();
        } catch {
          tokenManager.clear();
          setConnected(false);
          window.dispatchEvent(new CustomEvent('shk:session-expired'));
          return;
        }
      }

      if (!token || cancelled) return;

      instance = io(resolveSocketUrl(), {
        autoConnect: false,
        auth: getAuthPayload,
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      instance.on('connect', () => {
        if (!cancelled) setConnected(true);
      });
      instance.on('disconnect', () => {
        if (!cancelled) setConnected(false);
      });
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
          tokenManager.clear();
          setConnected(false);
          instance.close();
          window.dispatchEvent(new CustomEvent('shk:session-expired'));
        }
      });

      if (cancelled) {
        instance.close();
        return;
      }

      setSocket(instance);
      instance.connect();
    };

    void connectSocket();

    return () => {
      cancelled = true;
      instance?.close();
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
