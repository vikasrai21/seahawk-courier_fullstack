import { render, screen, waitFor, act } from '@testing-library/react';
import { SocketProvider, useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { io } from 'socket.io-client';
import { tokenManager } from '../../services/api';
import { refreshSession } from '../../services/session';
import React from 'react';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  tokenManager: {
    get: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../services/session', () => ({
  refreshSession: vi.fn(),
}));

// Create a mock socket instance
const mockSocketInstance = {
  on: vi.fn(),
  io: { on: vi.fn() },
  connect: vi.fn(),
  close: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocketInstance),
}));

const TestComponent = () => {
  const { socket, connected } = useSocket();

  return (
    <div>
      <div data-testid="socket">{socket ? 'true' : 'false'}</div>
      <div data-testid="connected">{connected ? 'true' : 'false'}</div>
    </div>
  );
};

describe('SocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketInstance.connected = false;
  });

  it('does not connect if user is not logged in', () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId('socket')).toHaveTextContent('false');
    expect(screen.getByTestId('connected')).toHaveTextContent('false');
    expect(io).not.toHaveBeenCalled();
  });

  it('connects when user is logged in', async () => {
    useAuth.mockReturnValue({ user: { email: 'test@example.com' } });
    tokenManager.get.mockReturnValue('fake-token');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(io).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1);
    });
  });

  it('attempts to refresh session if no token is available', async () => {
    useAuth.mockReturnValue({ user: { email: 'test@example.com' } });
    
    // First call returns null, simulating no token
    tokenManager.get.mockReturnValueOnce(null);
    refreshSession.mockResolvedValueOnce();
    
    // Second call returns token after refresh
    tokenManager.get.mockReturnValueOnce('new-token');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1);
      expect(io).toHaveBeenCalledTimes(1);
    });
  });

  it('dispatches session-expired if refresh fails', async () => {
    useAuth.mockReturnValue({ user: { email: 'test@example.com' } });
    tokenManager.get.mockReturnValue(null);
    refreshSession.mockRejectedValueOnce(new Error('Refresh failed'));

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1);
      expect(tokenManager.clear).toHaveBeenCalledTimes(1);
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    dispatchEventSpy.mockRestore();
  });
});
