import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenManager } from '../services/api';

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
    const token = tokenManager.get();
    if (!user || !token) return undefined;

    const instance = io(resolveSocketUrl(), {
      auth: { token },
      withCredentials: true,
    });

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));

    setSocket(instance);

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
