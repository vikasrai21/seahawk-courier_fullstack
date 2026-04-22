import { create } from 'zustand';
import api from '../services/api';

type ClientRecord = Record<string, any>;
type ShipmentRecord = Record<string, any>;

interface ShipmentsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
  search?: string;
  courier?: string;
  status?: string;
  clientCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DataState {
  clients: ClientRecord[];
  clientsLoadedAt: number | null;
  shipments: ShipmentRecord[];
  shipmentMeta: Record<string, any> | null;
  shipmentsLoadedAt: number | null;
  shipmentQueryCache: Record<string, { rows: ShipmentRecord[]; meta: Record<string, any> | null; loadedAt: number }>;
  fetchClients: (params?: Record<string, any>, force?: boolean) => Promise<ClientRecord[]>;
  fetchShipments: (params?: ShipmentsQuery, force?: boolean) => Promise<{ shipments: ShipmentRecord[]; meta: Record<string, any> | null }>;
  setShipments: (shipments: ShipmentRecord[], meta?: Record<string, any> | null) => void;
  invalidateClients: () => void;
  invalidateShipments: () => void;
}

function buildQuery(params: Record<string, any> = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

function normalizeShipmentQuery(params: ShipmentsQuery = {}) {
  const {
    search,
    clientCode,
    dateFrom,
    dateTo,
    ...rest
  } = params;

  return buildQuery({
    ...rest,
    ...(search ? { q: search } : {}),
    ...(clientCode ? { client: clientCode } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  });
}

function buildShipmentQueryKey(params: ShipmentsQuery = {}) {
  const query = normalizeShipmentQuery(params);
  const entries = Object.entries(query).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(entries);
}

export const useDataStore = create<DataState>((set, get) => ({
  clients: [],
  clientsLoadedAt: null,
  shipments: [],
  shipmentMeta: null,
  shipmentsLoadedAt: null,
  shipmentQueryCache: {},
  async fetchClients(params = {}, force = false) {
    const { clients, clientsLoadedAt } = get();
    if (!force && clients.length && clientsLoadedAt && Date.now() - clientsLoadedAt < 60_000) {
      return clients;
    }
    const response = await api.get('/clients', { params: buildQuery(params) });
    const data = response.data?.data || response.data || [];
    set({ clients: data, clientsLoadedAt: Date.now() });
    return data;
  },
  async fetchShipments(params = {}, force = false) {
    const { shipmentQueryCache } = get();
    const query = normalizeShipmentQuery(params);
    const key = buildShipmentQueryKey(params);
    const cached = shipmentQueryCache[key];
    if (!force && cached && Date.now() - cached.loadedAt < 30_000) {
      return { shipments: cached.rows, meta: cached.meta };
    }
    const response = await api.get('/shipments', { params: query });
    const payload = response.data || {};
    const rows = payload.shipments || payload.data || payload || [];
    const meta = {
      pagination: payload.pagination || null,
      stats: payload.stats || null,
    };
    const loadedAt = Date.now();
    set((state) => ({
      shipments: rows,
      shipmentMeta: meta,
      shipmentsLoadedAt: loadedAt,
      shipmentQueryCache: {
        ...state.shipmentQueryCache,
        [key]: { rows, meta, loadedAt },
      },
    }));
    return { shipments: rows, meta };
  },
  setShipments(shipments, meta = null) {
    set({ shipments, shipmentMeta: meta, shipmentsLoadedAt: Date.now() });
  },
  invalidateClients() {
    set({ clientsLoadedAt: null });
  },
  invalidateShipments() {
    set({ shipmentsLoadedAt: null, shipmentQueryCache: {} });
  },
}));
