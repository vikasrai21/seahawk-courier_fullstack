import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import NewEntryPage from '../../pages/NewEntryPage';
import api from '../../services/api';

// ── Mock API ──────────────────────────────────────────────────────────────
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ── Mock StatusBadge ──────────────────────────────────────────────────────
vi.mock('../../components/ui/StatusBadge', () => ({
  StatusBadge: ({ status }) => <span data-testid="status-badge">{status}</span>,
}));

// ── Mock AutoRateSuggestion ───────────────────────────────────────────────
vi.mock('../../components/shipment/AutoRateSuggestion', () => ({
  default: () => <div data-testid="auto-rate-suggestion" />,
}));

const mockClients = [
  { code: 'CL1', company: 'Acme Corp' },
  { code: 'CL2', company: 'Beta Ltd' },
];

const mockRecentShipments = [
  { id: 1, awb: 'TEST123', consignee: 'John', destination: 'Mumbai', courier: 'DTDC', weight: 2.5, amount: 150, status: 'Booked' },
];

describe('NewEntryPage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/clients') return Promise.resolve({ data: mockClients });
      if (url.includes('/shipments')) return Promise.resolve({ data: mockRecentShipments });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { id: 99, awb: 'NEW123' } });
  });

  const renderPage = () => render(<NewEntryPage toast={mockToast} />);

  it('renders the form with correct fields', async () => {
    renderPage();

    expect(screen.getByText('Quick Entry')).toBeInTheDocument();
    expect(screen.getByText('Shipment Date')).toBeInTheDocument();
    expect(screen.getByText('Client Account')).toBeInTheDocument();
    expect(screen.getByText('AWB Number')).toBeInTheDocument();
    expect(screen.getByText('Consignee Name')).toBeInTheDocument();
    expect(screen.getByText('Pincode')).toBeInTheDocument();
    expect(screen.getByText('Actual Wt')).toBeInTheDocument();
    expect(screen.getByText('Billing Amt')).toBeInTheDocument();
    expect(screen.getByText('Complete Booking')).toBeInTheDocument();
  });

  it('loads clients from API on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/clients');
    });
  });

  it('shows validation error when submitting without AWB and client', async () => {
    renderPage();

    const submitBtn = screen.getByText('Complete Booking');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('AWB and Client are required', 'error');
    });
  });

  it('submits the form with correct data', async () => {
    renderPage();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/clients');
    });

    // Fill in required fields
    const awbInput = screen.getByPlaceholderText('XXXXXXXXXXXX');
    fireEvent.change(awbInput, { target: { value: 'NEWAWB999' } });

    const clientSelect = screen.getByText('— Choose Client —').closest('select');
    fireEvent.change(clientSelect, { target: { value: 'CL1' } });

    const submitBtn = screen.getByText('Complete Booking');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/shipments', expect.objectContaining({
        awb: 'NEWAWB999',
        clientCode: 'CL1',
      }));
      expect(mockToast).toHaveBeenCalledWith('✓ AWB NEW123 saved', 'success');
    });
  });

  it('shows recent shipments in the session activity log', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Session Activity Log')).toBeInTheDocument();
      expect(screen.getByText('TEST123')).toBeInTheDocument();
      // DTDC appears in both the form dropdown and the activity log
      expect(screen.getAllByText('DTDC').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays keyboard shortcut hint', () => {
    renderPage();

    expect(screen.getByText('Enter to move · Ctrl+Enter to save')).toBeInTheDocument();
  });
});
