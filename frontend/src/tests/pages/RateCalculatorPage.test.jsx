import { render, screen, waitFor, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import RateCalculatorPage from '../../pages/RateCalculatorPage';
import { useDataStore } from '../../stores/dataStore';
import api from '../../services/api';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../stores/dataStore', () => ({
  useDataStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the json fetch
global.fetch = vi.fn();

describe('RateCalculatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    useDataStore.mockImplementation((selector) => {
      const state = {
        clients: [{ code: 'C1', name: 'Client 1' }],
        fetchClients: vi.fn().mockResolvedValue(),
      };
      return selector(state);
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { pincode: '110001', city: 'New Delhi', state: 'Delhi', zone: 'North' }
      ]),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderPage = () => render(
    <BrowserRouter>
      <RateCalculatorPage />
    </BrowserRouter>
  );

  it('renders initial state correctly', async () => {
    renderPage();
    expect(screen.getByText('Rate Calculator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PIN or city')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument();
    expect(screen.getByText('Waiting for destination')).toBeInTheDocument();
  });

  it('handles pincode search and looks up via API if not in cache/local', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pincodes/lookup') {
        return Promise.resolve({
          data: {
            postOffice: { Name: 'Test PO', District: 'TestCity', State: 'TestState' }
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderPage();

    const input = screen.getByPlaceholderText('PIN or city');
    
    // Type a 6 digit pin
    fireEvent.change(input, { target: { value: '999999' } });
    
    // Wait for debounce and API call
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pincodes/lookup', { params: { pin: '999999' } });
    });
  });

  it('fetches lane intelligence when destination and weight are provided', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pincodes/lookup') {
        return Promise.resolve({
          data: {
            postOffice: { Name: 'Test PO', District: 'TestCity', State: 'TestState' }
          }
        });
      }
      if (url === '/rates/intelligence') {
        return Promise.resolve({
          data: {
            byCourier: []
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderPage();

    const pinInput = screen.getByPlaceholderText('PIN or city');
    fireEvent.change(pinInput, { target: { value: '999999' } });
    
    const weightInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(weightInput, { target: { value: '2.5' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/rates/intelligence', expect.objectContaining({
        params: expect.objectContaining({
          pincode: '999999',
          shipType: 'doc',
        })
      }));
    });
  });

  it('opens advanced controls when clicked', async () => {
    renderPage();

    const toggleBtn = screen.getByText(/Advanced controls/i);
    fireEvent.click(toggleBtn);

    // After clicking, length/width/height inputs should be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('L')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('B')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('H')).toBeInTheDocument();
    });
  });

});
