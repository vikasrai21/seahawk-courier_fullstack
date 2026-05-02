import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crosshair, MapPin, RotateCcw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

const INDIA_BOUNDS = [
  [6.4, 68.1],
  [37.6, 97.4],
];

const STATUS_COLORS = {
  Booked: '#64748b',
  PickedUp: '#0f766e',
  InTransit: '#2563eb',
  OutForDelivery: '#f97316',
  Delayed: '#dc2626',
  Failed: '#b91c1c',
  NDR: '#b91c1c',
  RTO: '#7c2d12',
  Delivered: '#16a34a',
};

const STATE_POINTS = [
  ['Delhi', ['delhi', 'new delhi'], [28.6139, 77.2090]],
  ['Haryana', ['haryana', 'gurugram', 'gurgaon', 'faridabad'], [29.0588, 76.0856]],
  ['Uttar Pradesh', ['uttar pradesh', 'noida', 'ghaziabad', 'lucknow', 'kanpur'], [26.8467, 80.9462]],
  ['Rajasthan', ['rajasthan', 'jaipur'], [26.9124, 75.7873]],
  ['Punjab', ['punjab', 'ludhiana', 'amritsar', 'jalandhar'], [31.1471, 75.3412]],
  ['Maharashtra', ['maharashtra', 'mumbai', 'pune', 'nagpur'], [19.7515, 75.7139]],
  ['Gujarat', ['gujarat', 'ahmedabad', 'surat', 'vadodara'], [22.2587, 71.1924]],
  ['Karnataka', ['karnataka', 'bengaluru', 'bangalore', 'mysuru'], [15.3173, 75.7139]],
  ['Tamil Nadu', ['tamil nadu', 'chennai', 'coimbatore'], [11.1271, 78.6569]],
  ['Telangana', ['telangana', 'hyderabad'], [17.3850, 78.4867]],
  ['Andhra Pradesh', ['andhra', 'visakhapatnam', 'vijayawada'], [15.9129, 79.7400]],
  ['Kerala', ['kerala', 'kochi', 'trivandrum'], [10.8505, 76.2711]],
  ['West Bengal', ['west bengal', 'kolkata'], [22.9868, 87.8550]],
  ['Bihar', ['bihar', 'patna'], [25.0961, 85.3131]],
  ['Madhya Pradesh', ['madhya pradesh', 'indore', 'bhopal'], [22.9734, 78.6569]],
  ['Odisha', ['odisha', 'orissa', 'bhubaneswar'], [20.9517, 85.0985]],
  ['Assam', ['assam', 'guwahati'], [26.2006, 92.9376]],
];

function getRows(response) {
  return response?.shipments || response?.data?.shipments || [];
}

function stateFromText(text = '') {
  const value = String(text).toLowerCase();
  return STATE_POINTS.find(([, aliases]) => aliases.some((alias) => value.includes(alias))) || null;
}

function getShipmentPoint(row, index) {
  const lat = Number(row.geo?.lat);
  const lon = Number(row.geo?.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon, precision: 'exact', label: row.geo?.label || row.destination || 'Mapped location' };
  }

  const state = stateFromText(`${row.destination || ''} ${row.geo?.label || ''} ${row.latestEvent?.location || ''}`);
  if (!state) return null;
  const ring = index % 9;
  const jitterLat = (Math.floor(ring / 3) - 1) * 0.08;
  const jitterLon = ((ring % 3) - 1) * 0.08;
  return {
    lat: state[2][0] + jitterLat,
    lon: state[2][1] + jitterLon,
    precision: 'state',
    label: state[0],
  };
}

function buildMarkerIcon(status, active = false) {
  const color = STATUS_COLORS[status] || '#334155';
  return L.divIcon({
    className: '',
    html: `
      <span style="
        width:${active ? 22 : 18}px;
        height:${active ? 22 : 18}px;
        display:block;
        border-radius:999px;
        background:${color};
        border:3px solid #fff;
        box-shadow:0 0 0 ${active ? 11 : 8}px ${color}33, 0 12px 24px rgba(15,23,42,.25);
      "></span>
    `,
    iconSize: [active ? 22 : 18, active ? 22 : 18],
    iconAnchor: [active ? 11 : 9, active ? 11 : 9],
  });
}

export default function ClientLiveMapPage({ toast }) {
  const { dark } = useTheme();
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeDelivered, setIncludeDelivered] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      center: [22.8, 79.2],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    map.fitBounds(INDIA_BOUNDS, { padding: [24, 24] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/portal/map/shipments?range=90d&includeDelivered=${includeDelivered ? '1' : '0'}`);
        setRows(getRows(res));
        setSelectedShipment(null);
      } catch (err) {
        toast?.(err.message || 'Failed to load live map', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [includeDelivered, toast]);

  const statusGroups = useMemo(() => {
    const summary = new Map();
    for (const row of rows) summary.set(row.status || 'Booked', (summary.get(row.status || 'Booked') || 0) + 1);
    return [...summary.entries()];
  }, [rows]);

  const pins = useMemo(() => {
    return rows
      .map((row, index) => ({ row, point: getShipmentPoint(row, index) }))
      .filter((item) => item.point);
  }, [rows]);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    pins.forEach(({ row, point }) => {
      const isSelected = selectedShipment?.awb === row.awb;
      const marker = L.marker([point.lat, point.lon], {
        icon: buildMarkerIcon(row.status, isSelected),
        keyboard: true,
        title: `${row.awb} - ${row.destination || point.label}`,
      });
      marker.on('click', () => {
        setSelectedShipment(row);
        mapRef.current?.flyTo([point.lat, point.lon], Math.max(mapRef.current.getZoom(), point.precision === 'exact' ? 13 : 8), { duration: 0.45 });
      });
      marker.bindTooltip(
        `<strong>${row.awb}</strong><br>${row.destination || point.label}<br>${row.status || 'Booked'}${point.precision === 'state' ? '<br>Approximate state pin' : ''}`,
        { direction: 'top', offset: [0, -10], opacity: 0.94 }
      );
      markerLayerRef.current.addLayer(marker);
    });
  }, [pins, selectedShipment]);

  const fitIndia = () => {
    mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: [24, 24] });
  };

  const fitPins = () => {
    if (!pins.length) return fitIndia();
    const bounds = L.latLngBounds(pins.map(({ point }) => [point.lat, point.lon]));
    mapRef.current?.fitBounds(bounds, { padding: [56, 56], maxZoom: 12 });
  };

  return (
    <div className={`min-h-full ${dark ? 'bg-slate-950' : ''}`}>
      <div className="mx-auto client-premium-main">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Live Shipment Map</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">OpenStreetMap street view for active logistics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncludeDelivered((value) => !value)}
              className="client-action-btn-secondary"
            >
              {includeDelivered ? 'Delivered + Active' : 'Active Only'}
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_45px_-34px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {statusGroups.map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#64748b' }} />
                    {status}: {count}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={fitPins} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:text-slate-300" title="Fit shipment pins">
                  <Crosshair size={17} />
                </button>
                <button type="button" onClick={fitIndia} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:text-slate-300" title="Reset to India">
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>

            <div className="relative h-[640px] bg-slate-100 dark:bg-slate-950">
              <div ref={mapNodeRef} className="h-full w-full" />
              {loading && (
                <div className="absolute inset-0 z-[500] grid place-items-center bg-white/70 text-sm font-bold text-slate-600 backdrop-blur-sm dark:bg-slate-950/70 dark:text-slate-300">
                  Locating shipments...
                </div>
              )}
              {!loading && pins.length === 0 && (
                <div className="absolute inset-0 z-[500] grid place-items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                  No mapped shipments for this range.
                </div>
              )}
              <div className="absolute bottom-4 left-4 z-[500] rounded-full border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                OSM tiles require internet access
              </div>
            </div>
          </div>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-teal-600 dark:text-teal-300">Shipment Pins</div>
                <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Map results</h2>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                <MapPin size={18} />
              </div>
            </div>

            {selectedShipment && (
              <div className="mt-4 rounded-[18px] border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">{selectedShipment.awb}</div>
                  <StatusBadge status={selectedShipment.status} />
                </div>
                <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{selectedShipment.destination || selectedShipment.geo?.label || 'Destination pending'}</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{selectedShipment.courier || 'Courier pending'} - {selectedShipment.latestEvent?.location || 'Location pending'}</div>
              </div>
            )}

            <div className="mt-4 max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {!loading && pins.length === 0 ? (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  No shipments have a usable map location yet.
                </div>
              ) : pins.map(({ row, point }) => (
                <button
                  type="button"
                  key={row.awb}
                  onClick={() => {
                    setSelectedShipment(row);
                    mapRef.current?.flyTo([point.lat, point.lon], point.precision === 'exact' ? 14 : 8, { duration: 0.45 });
                  }}
                  className="block w-full rounded-[18px] border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-teal-200 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-900 dark:hover:bg-teal-950/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">{row.awb}</div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{row.destination || point.label || 'Destination pending'}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {row.courier || 'Courier pending'} - {point.precision === 'exact' ? 'Exact geocode' : `Approximate: ${point.label}`}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
