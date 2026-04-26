import { render, screen, waitFor, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '../../pages/LoginPage';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the canvas getContext for SpaceBackground animation
const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  globalCompositeOperation: '',
};
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useAuth.mockReturnValue({ login: mockLogin });
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderPage = () =>
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

  it('renders login form correctly', () => {
    renderPage();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@seahawk.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText(/launch dashboard/i)).toBeInTheDocument();
  });

  it('handles successful login for ADMIN → navigates to /app', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'ADMIN' });

    renderPage();

    const emailInput = screen.getByPlaceholderText('admin@seahawk.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'admin@seahawk.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin@12345' } });

    await act(async () => {
      fireEvent.click(screen.getByText(/launch dashboard/i));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@seahawk.com', 'Admin@12345', true);
      expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
    });
  });

  it('handles successful login for CLIENT → navigates to /portal', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'CLIENT' });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('admin@seahawk.com'), {
      target: { value: 'client@seahawk.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Client@12345' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/launch dashboard/i));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/portal', { replace: true });
    });
  });

  it('displays error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('admin@seahawk.com'), {
      target: { value: 'wrong@seahawk.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'badpass' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/launch dashboard/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument();
    });

    // Password should be cleared after error
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('');
  });

  it('unchecking "Remember me" removes saved email on login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'STAFF' });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('admin@seahawk.com'), {
      target: { value: 'test@seahawk.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass123' },
    });

    // Uncheck the "Remember me" checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(screen.getByText(/launch dashboard/i));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@seahawk.com', 'pass123', false);
    });
  });
});
