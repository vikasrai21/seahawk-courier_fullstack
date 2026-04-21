import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosPost, apiGet, tokenSet } = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  apiGet: vi.fn(),
  tokenSet: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    post: axiosPost,
  },
}));

vi.mock('../../services/api', () => ({
  default: {
    get: apiGet,
  },
  tokenManager: {
    set: tokenSet,
  },
}));

describe('session service', () => {
  beforeEach(() => {
    axiosPost.mockReset();
    apiGet.mockReset();
    tokenSet.mockReset();
    document.cookie = 'csrf_token=test-csrf-token';
  });

  it('refreshSession exchanges the refresh cookie for a token and reloads the user', async () => {
    axiosPost.mockResolvedValue({
      data: {
        data: {
          accessToken: 'fresh-access-token',
        },
      },
    });
    apiGet.mockResolvedValue({
      data: {
        id: 7,
        email: 'ops@example.com',
        role: 'ADMIN',
      },
    });

    const { refreshSession } = await import('../../services/session');
    const result = await refreshSession();

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost.mock.calls[0][0]).toContain('/api/auth/refresh');
    expect(axiosPost.mock.calls[0][1]).toEqual({});
    expect(axiosPost.mock.calls[0][2]).toEqual({
      withCredentials: true,
      headers: { 'x-csrf-token': 'test-csrf-token' },
    });
    expect(tokenSet).toHaveBeenCalledWith('fresh-access-token');
    expect(apiGet).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual({
      data: {
        id: 7,
        email: 'ops@example.com',
        role: 'ADMIN',
      },
    });
  });
});
