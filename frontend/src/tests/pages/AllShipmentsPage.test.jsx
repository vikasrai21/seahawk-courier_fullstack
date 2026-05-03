import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AllShipmentsPage from '../../pages/AllShipmentsPage';
import api from '../../services/api';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockShipments = [
  {
    id: 1,
    awb: '100123456789',
    date: '2023-10-01',
    clientCode: 'C1',
    client: { company: 'Client A' },
    consignee: 'John Doe',
    destination: 'Mumbai',
    courier: 'Delhivery',
    service: 'Surface',
    amount: 150.00,
    weight: 2.5,
    status: 'InTransit'
  },
  {
    id: 2,
    awb: '200987654321',
    date: '2023-10-02',
    clientCode: 'C2',
    client: { company: 'Client B' },
    consignee: 'Jane Smith',
    destination: 'Delhi',
    courier: 'Trackon',
    service: 'Air',
    amount: 300.00,
    weight: 1.0,
    status: 'Delivered'
  }
];

describe('AllShipmentsPage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockShipments, pagination: { total: 2 } });
    window.confirm = vi.fn(() => true);
  });

  const renderPage = () => render(
    <BrowserRouter>
      <AllShipmentsPage toast={mockToast} />
    </BrowserRouter>
  );

  it('renders shipments from API on load', async () => {
    renderPage();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/shipments?limit=200&includeDetails=1');
      expect(screen.getByText('100123456789')).toBeInTheDocument();
      expect(screen.getByText('200987654321')).toBeInTheDocument();
    });
  });

  it('filters shipments when refresh is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('100123456789')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by AWB/i);
    fireEvent.change(searchInput, { target: { value: '100123456789' } });

    const refreshBtn = screen.getByText(/Refresh List/i);
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/shipments?q=100123456789&limit=200&includeDetails=1');
    });
  });

  it('shows bulk actions when shipments are selected', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('100123456789')).toBeInTheDocument();
    });

    // Bulk actions should not be visible initially
    expect(screen.queryByText(/Set Progress Status/i)).not.toBeInTheDocument();

    // Click the checkbox for the first shipment (it's the first square icon in the row)
    // The very first square is the header select all, so we grab the second one
    const checkboxes = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-square'));
    
    // Check header
    fireEvent.click(checkboxes[0]); // Select all
    
    await waitFor(() => {
      expect(screen.getByText(/Set Progress Status/i)).toBeInTheDocument();
    });
  });

  it('calls delete API when delete button is clicked and confirmed', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('100123456789')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle('Delete Shipment');
    fireEvent.click(deleteBtns[0]); // Delete first shipment

    expect(window.confirm).toHaveBeenCalledWith('Permanently delete AWB 100123456789?');

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/shipments/1');
      expect(mockToast).toHaveBeenCalledWith('Shipment deleted', 'success');
    });
  });
});
