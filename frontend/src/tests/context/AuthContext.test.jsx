import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  apiGet,
  setUnauthorizedHandler,
  tokenGet,
  tokenSet,
  tokenSetRemember,
  tokenClear,
  clearSession,
  refreshSession,
  seedCsrfCookie,
} = vi.hoisted(() => {
  let unauthorizedHandler = null;
  return {
    apiGet: vi.fn(),
    setUnauthorizedHandler: vi.fn((handler) => {
      unauthorizedHandler = handler;
    }),
    tokenGet: vi.fn(() => null),
    tokenSet: vi.fn(),
    tokenSetRemember: vi.fn(),
    tokenClear: vi.fn(),
    clearSession: vi.fn(),
    refreshSession: vi.fn(),
    seedCsrfCookie: vi.fn(),
  };
});

vi.mock('../../services/api', () => ({
  default: {
    get: apiGet,
    post: vi.fn(),
  },
  setUnauthorizedHandler,
  tokenManager: {
    get: tokenGet,
    set: tokenSet,
    setRemember: tokenSetRemember,
    clear: tokenClear,
  },
}));

vi.mock('../../services/session', () => ({
  clearSession,
  refreshSession,
  seedCsrfCookie,
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';

function Probe() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return <div>{user ? user.email : 'logged-out'}</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    apiGet.mockReset();
    setUnauthorizedHandler.mockClear();
    tokenGet.mockReset();
    tokenGet.mockReturnValue(null);
    tokenSet.mockReset();
    tokenSetRemember.mockReset();
    tokenClear.mockReset();
    clearSession.mockReset();
    refreshSession.mockReset();
    seedCsrfCookie.mockReset();
  });

  it('clears the active user when a session-expired event is raised', async () => {
    // Seed localStorage so AuthProvider attempts refreshSession
    window.localStorage.setItem('shk_remember', '1');

    refreshSession.mockResolvedValue({
      data: {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await screen.findByText('admin@example.com');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      window.dispatchEvent(new CustomEvent('shk:session-expired'));
    });

    await waitFor(() => {
      expect(clearSession).toHaveBeenCalledTimes(1);
      expect(screen.getByText('logged-out')).toBeInTheDocument();
    });
    expect(setUnauthorizedHandler).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
