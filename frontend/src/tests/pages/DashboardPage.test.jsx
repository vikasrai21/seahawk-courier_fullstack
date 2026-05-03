import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import DashboardPage from '../../pages/DashboardPage';
import { BrowserRouter } from 'react-router-dom';

// ── Mock API ──────────────────────────────────────────────────────────────
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../services/api';

// ── Mock AuthContext ──────────────────────────────────────────────────────
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
    isAdmin: true,
    isOwner: false,
    isClient: false,
    hasRole: vi.fn((role) => role === 'OPS_MANAGER' || role === 'ADMIN'),
    loading: false,
  })),
}));

// ── Mock SocketContext ────────────────────────────────────────────────────
vi.mock('../../context/SocketContext', () => ({
  useSocket: vi.fn(() => ({ socket: null })),
}));

// ── Mock dashboard sub-components to keep unit test focused ───────────────
vi.mock('../../components/dashboard/DashboardStats', () => ({
  default: ({ overview }) => (
    <div data-testid="dashboard-stats">
      {overview ? `Total: ${overview.totalShipments}` : 'No data'}
    </div>
  ),
}));

vi.mock('../../components/dashboard/DashboardAlerts', () => ({
  default: ({ actions }) => (
    <div data-testid="dashboard-alerts">
      {actions ? `${actions.ndrCount || 0} NDRs` : 'No alerts'}
    </div>
  ),
}));

vi.mock('../../components/dashboard/DashboardCharts', () => ({
  default: () => <div data-testid="dashboard-charts">Charts</div>,
}));

vi.mock('../../components/dashboard/DashboardRecentShipments', () => ({
  default: ({ shipments }) => (
    <div data-testid="dashboard-recent">
      {shipments?.length || 0} recent shipments
    </div>
  ),
}));

vi.mock('../../components/dashboard/SmartRevenueTable', () => ({
  default: () => <div data-testid="smart-revenue">Revenue Table</div>,
}));

// ── Mock Loading components ───────────────────────────────────────────────
vi.mock('../../components/ui/Loading', () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}));

vi.mock('../../components/ui/Skeleton', () => ({
  Skeleton: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

const mockOverview = {
  totalShipments: 245,
  delivered: 190,
  inTransit: 30,
  rto: 10,
  pending: 15,
  revenue: 125000,
};

const mockCouriers = [
  { courier: 'Delhivery', count: 100, delivered: 80 },
  { courier: 'BlueDart', count: 50, delivered: 45 },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Setup API responses
    api.get.mockImplementation((url) => {
      if (url.includes('/analytics/overview')) {
        return Promise.resolve({ data: mockOverview });
      }
      if (url.includes('/analytics/couriers')) {
        return Promise.resolve({ data: mockCouriers });
      }
      if (url.includes('/ops/pending-actions')) {
        return Promise.resolve({ data: { ndrCount: 5, pickupCount: 2 } });
      }
      if (url.includes('/ops/recent-activity')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/shipments')) {
        return Promise.resolve({ data: { shipments: [] } });
      }
      if (url.includes('/ops/dashboard')) {
        return Promise.resolve({ data: { recentShipments: [] } });
      }
      if (url.includes('/analytics/smart-revenue')) {
        return Promise.resolve({ data: {} });
      }
      if (url.includes('/ops/rto-alerts')) {
        return Promise.resolve({ data: { alerts: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );

  it('renders page header with Command Center title', async () => {
    renderPage();

    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('displays date range filter buttons', () => {
    renderPage();

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('loads data from API and renders dashboard stats', async () => {
    renderPage();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByText('Total: 245')).toBeInTheDocument();
    });
  });

  it('renders dashboard alerts with NDR count', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-alerts')).toBeInTheDocument();
      expect(screen.getByText('5 NDRs')).toBeInTheDocument();
    });
  });

  it('renders quick action command bar', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('New Shipment')).toBeInTheDocument();
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
      expect(screen.getByText('Scan AWB')).toBeInTheDocument();
      expect(screen.getByText('Rate Calculator')).toBeInTheDocument();
    });
  });

  it('calls multiple API endpoints on load', async () => {
    renderPage();

    await waitFor(() => {
      // Should call at minimum: overview (current + previous), couriers, pending-actions, activity, shipments, ops dashboard, smart-revenue, rto-alerts
      const getCalls = api.get.mock.calls.map(c => c[0]);
      expect(getCalls.some(u => u.includes('/analytics/overview'))).toBe(true);
      expect(getCalls.some(u => u.includes('/analytics/couriers'))).toBe(true);
      expect(getCalls.some(u => u.includes('/ops/pending-actions'))).toBe(true);
    });
  });
});
