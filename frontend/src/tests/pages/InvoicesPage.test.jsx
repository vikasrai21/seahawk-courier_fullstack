import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import InvoicesPage from '../../pages/InvoicesPage';

// ── Mock API ──────────────────────────────────────────────────────────────
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ── Mock useFetch ─────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
vi.mock('../../hooks/useFetch', () => ({
  useFetch: vi.fn((url) => {
    if (url === '/invoices') {
      return {
        data: mockInvoices,
        loading: false,
        error: null,
        refetch: mockRefetch,
        setData: vi.fn(),
      };
    }
    if (url === '/clients') {
      return {
        data: mockClients,
        loading: false,
        error: null,
        refetch: vi.fn(),
        setData: vi.fn(),
      };
    }
    return { data: null, loading: false, error: null, refetch: vi.fn(), setData: vi.fn() };
  }),
}));

const mockClients = [
  { code: 'CL1', company: 'Acme Corp', address: 'Mumbai, Maharashtra', gst: '27AADCA1234M1ZP', email: 'billing@acme.com' },
  { code: 'CL2', company: 'Beta Ltd', address: 'Gurugram, Haryana', gst: '06AJDPR0914N2Z1', email: 'accounts@beta.com' },
];

const mockInvoices = [
  {
    id: 1,
    invoiceNo: 'INV-2025-001',
    clientCode: 'CL1',
    client: { company: 'Acme Corp' },
    fromDate: '2025-04-01',
    toDate: '2025-04-30',
    subtotal: 5000,
    gstPercent: 18,
    gstAmount: 900,
    total: 5900,
    status: 'DRAFT',
    _count: { items: 12 },
  },
  {
    id: 2,
    invoiceNo: 'INV-2025-002',
    clientCode: 'CL2',
    client: { company: 'Beta Ltd' },
    fromDate: '2025-04-01',
    toDate: '2025-04-30',
    subtotal: 3000,
    gstPercent: 18,
    gstAmount: 540,
    total: 3540,
    status: 'PAID',
    _count: { items: 8 },
  },
];

describe('InvoicesPage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  const renderPage = () => render(<InvoicesPage toast={mockToast} />);

  it('renders invoice list with correct data', () => {
    renderPage();

    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2025-002')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
  });

  it('displays record count and draft badge', () => {
    renderPage();

    expect(screen.getByText('2 records')).toBeInTheDocument();
    expect(screen.getByText('1 draft')).toBeInTheDocument();
  });

  it('shows the generate invoice button and opens modal', async () => {
    renderPage();

    const genBtn = screen.getByText('Generate Invoice');
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText('— Select Client —')).toBeInTheDocument();
      expect(screen.getByText('From Date *')).toBeInTheDocument();
      expect(screen.getByText('To Date *')).toBeInTheDocument();
    });
  });

  it('shows GST preview in the generate modal with intra-state split', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Generate Invoice'));

    await waitFor(() => {
      // Default preview shows IGST for no-client-selected
      expect(screen.getByText('GST Invoice Preview')).toBeInTheDocument();
    });
  });

  it('renders action buttons for each invoice', () => {
    renderPage();

    // View, PDF, WhatsApp for each invoice = 2 * 3 = 6 action buttons
    const viewBtns = screen.getAllByText('View');
    const pdfBtns = screen.getAllByText('PDF');
    const waBtns = screen.getAllByText('WhatsApp');

    expect(viewBtns).toHaveLength(2);
    expect(pdfBtns).toHaveLength(2);
    expect(waBtns).toHaveLength(2);
  });

  it('displays formatted currency amounts', () => {
    renderPage();

    // ₹5,900.00 total for first invoice
    expect(screen.getByText('₹5,900.00')).toBeInTheDocument();
    expect(screen.getByText('₹3,540.00')).toBeInTheDocument();
  });
});
