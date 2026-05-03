import { render, screen, waitFor, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import WalletPage from '../../pages/WalletPage';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock TransactionList to simplify the test
vi.mock('../../components/wallet/TransactionList', () => ({
  default: ({ transactions }) => (
    <div data-testid="transaction-list">
      {transactions?.length || 0} transactions
    </div>
  ),
}));

describe('WalletPage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders ADMIN view and fetches all wallets', async () => {
    useAuth.mockReturnValue({ isAdmin: true, hasRole: () => true });
    
    api.get.mockImplementation((url) => {
      if (url === '/wallet') {
        return Promise.resolve({
          data: {
            wallets: [
              { clientCode: 'C1', company: 'Client 1', walletBalance: 1500 },
              { clientCode: 'C2', company: 'Client 2', walletBalance: 200 },
            ]
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<WalletPage toast={mockToast} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/wallet');
    });

    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('₹1,700')).toBeInTheDocument(); // 1500 + 200
    
    // Check if the side ledger renders clients
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('C2')).toBeInTheDocument();
  });

  it('renders CLIENT view and fetches only their wallet', async () => {
    useAuth.mockReturnValue({ isAdmin: false, hasRole: () => false });
    
    api.get.mockImplementation((url) => {
      if (url === '/wallet/me') {
        return Promise.resolve({
          data: { clientCode: 'ME1', company: 'My Company', walletBalance: 5000 }
        });
      }
      if (url.includes('/transactions')) {
        return Promise.resolve({ data: { transactions: [{ id: 1, amount: 100 }] } });
      }
      return Promise.resolve({ data: [] });
    });

    render(<WalletPage toast={mockToast} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/wallet/me');
    });

    // Client view should not show total/global stats
    expect(screen.queryByText('Total Balance')).not.toBeInTheDocument();

    // But it should auto-select and show their balance
    await waitFor(() => {
      expect(screen.getByText('My Company')).toBeInTheDocument();
    });
    
    // Check if transactions are fetched automatically for the selected wallet
    expect(api.get).toHaveBeenCalledWith('/wallet/ME1/transactions?limit=50');
    expect(screen.getByTestId('transaction-list')).toHaveTextContent('1 transactions');
  });

  it('allows ADMIN to select a wallet and view transactions', async () => {
    useAuth.mockReturnValue({ isAdmin: true, hasRole: () => true });
    
    api.get.mockImplementation((url) => {
      if (url === '/wallet') {
        return Promise.resolve({
          data: [
            { clientCode: 'C1', company: 'Client 1', walletBalance: 1000 }
          ]
        });
      }
      if (url === '/wallet/C1/transactions?limit=50') {
        return Promise.resolve({ data: [{ id: 1, amount: 50 }, { id: 2, amount: 20 }] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<WalletPage toast={mockToast} />);

    // Wait for the client to be listed
    await waitFor(() => {
      expect(screen.getByText('C1')).toBeInTheDocument();
    });

    // It should say "No client selected" initially
    expect(screen.getByText('No client selected')).toBeInTheDocument();

    // Click the client in the sidebar
    fireEvent.click(screen.getByText('Client 1'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/wallet/C1/transactions?limit=50');
      expect(screen.queryByText('No client selected')).not.toBeInTheDocument();
    });

    // Check if transaction list renders the mocked content
    expect(screen.getByTestId('transaction-list')).toHaveTextContent('2 transactions');
  });

  it('opens Adjust modal when ADMIN clicks Manual Adjustment', async () => {
    useAuth.mockReturnValue({ isAdmin: true, hasRole: () => true });
    api.get.mockResolvedValue({ data: [] });

    render(<WalletPage toast={mockToast} />);

    const adjustBtn = screen.getByText(/Manual Adjustment/i);
    fireEvent.click(adjustBtn);

    await waitFor(() => {
      expect(screen.getByText('Manual Intelligence Adjustment')).toBeInTheDocument();
    });
  });

  it('filters wallets when searching', async () => {
    useAuth.mockReturnValue({ isAdmin: true, hasRole: () => true });
    api.get.mockResolvedValue({
      data: [
        { clientCode: 'ABC', company: 'Alpha', walletBalance: 100 },
        { clientCode: 'XYZ', company: 'Zeta', walletBalance: 200 },
      ]
    });

    render(<WalletPage toast={mockToast} />);

    await waitFor(() => {
      expect(screen.getByText('ABC')).toBeInTheDocument();
      expect(screen.getByText('XYZ')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search client...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    // XYZ should disappear (debounced)
    await waitFor(() => {
      expect(screen.queryByText('XYZ')).not.toBeInTheDocument();
      expect(screen.getByText('ABC')).toBeInTheDocument();
    });
  });
});
