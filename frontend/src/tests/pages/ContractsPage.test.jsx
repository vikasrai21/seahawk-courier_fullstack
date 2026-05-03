import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ContractsPage from '../../pages/ContractsPage';

// ── Mock API ──────────────────────────────────────────────────────────────
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// ── Mock data ─────────────────────────────────────────────────────────────
const mockClients = [
  { code: 'CL1', company: 'Acme Corp' },
  { code: 'CL2', company: 'Beta Ltd' },
];

const mockContracts = [
  {
    id: 1,
    clientCode: 'CL1',
    name: 'DTDC FY26',
    courier: 'DTDC',
    service: 'surface',
    pricingType: 'MATRIX',
    baseRate: 30,
    baseCharge: 50,
    minCharge: 60,
    fuelSurcharge: 12,
    gstPercent: 18,
    active: true,
    pricingRules: [
      { mode: 'air', zone: 'metro', weightSlab: '0-500g', rate: 45, minCharge: 60, baseCharge: 50, perKgRate: 0 },
    ],
    updatedAt: '2025-04-15T00:00:00Z',
  },
  {
    id: 2,
    clientCode: 'CL1',
    name: 'BlueDart Express',
    courier: 'BlueDart',
    service: 'air',
    pricingType: 'PER_KG',
    baseRate: 0,
    baseCharge: 0,
    minCharge: 100,
    fuelSurcharge: 18,
    gstPercent: 18,
    active: false,
    pricingRules: [],
    updatedAt: '2025-03-01T00:00:00Z',
  },
];

const mockRefetch = vi.fn();

vi.mock('../../hooks/useFetch', () => ({
  useFetch: vi.fn((url) => {
    if (url === '/contracts') {
      return { data: mockContracts, loading: false, error: null, refetch: mockRefetch, setData: vi.fn() };
    }
    if (url === '/clients') {
      return { data: mockClients, loading: false, error: null, refetch: vi.fn(), setData: vi.fn() };
    }
    return { data: null, loading: false, error: null, refetch: vi.fn(), setData: vi.fn() };
  }),
}));

describe('ContractsPage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  const renderPage = () => render(<ContractsPage toast={mockToast} />);

  it('renders page header and Add Contract button', () => {
    renderPage();

    expect(screen.getByText('Contracts & Pricing')).toBeInTheDocument();
    expect(screen.getByText('Add Contract')).toBeInTheDocument();
  });

  it('renders grouped contracts by client code', () => {
    renderPage();

    // CL1 has 2 contracts
    expect(screen.getByText('CL1')).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/2 contracts/)).toBeInTheDocument();
  });

  it('expands a client group to show contract details', async () => {
    renderPage();

    // Click the CL1 accordion
    const clientRow = screen.getByText('CL1');
    fireEvent.click(clientRow);

    await waitFor(() => {
      expect(screen.getByText('DTDC FY26')).toBeInTheDocument();
      expect(screen.getByText('BlueDart Express')).toBeInTheDocument();
    });
  });

  it('shows pricing cells when expanded', async () => {
    renderPage();

    fireEvent.click(screen.getByText('CL1'));

    await waitFor(() => {
      // Shows base, min, fuel, GST, updated date cells
      expect(screen.getByText('₹50.00')).toBeInTheDocument(); // Base
      expect(screen.getByText('₹60.00')).toBeInTheDocument(); // Minimum
      expect(screen.getByText('12%')).toBeInTheDocument(); // Fuel surcharge
    });
  });

  it('opens new contract modal when Add Contract is clicked', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Add Contract'));

    await waitFor(() => {
      expect(screen.getByText('New Contract')).toBeInTheDocument();
      expect(screen.getByText('Select client')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. DTDC FY26 matrix')).toBeInTheDocument();
      expect(screen.getByText('Save Contract')).toBeInTheDocument();
    });
  });

  it('shows inactive badge for inactive contracts', async () => {
    renderPage();

    fireEvent.click(screen.getByText('CL1'));

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });
});
