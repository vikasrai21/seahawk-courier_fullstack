import { describe, expect, it } from 'vitest';
import {
  COURIERS,
  COURIER_TO_PARTNER,
  RATE_VALIDITY,
  courierCost,
  getRateAge,
  proposalSell,
  stateToZones,
} from '../../utils/rateEngine.js';

describe('rateEngine', () => {
  it('maps major regions to the expected zone families', () => {
    expect(stateToZones('Delhi', '', '').seahawkZone).toBe('Delhi & NCR');
    expect(stateToZones('Assam', 'Kamrup', 'Guwahati').seahawkZone).toBe('North East');
    expect(stateToZones('Gujarat', 'Ahmedabad', 'Ahmedabad').seahawkZone).toBe('Metro Cities');
    expect(stateToZones('Kerala', 'Ernakulam', 'Kochi').seahawkZone).toBe('Rest of India');
  });

  it('calculates courier cost for document and surface products', () => {
    const delhiZone = stateToZones('Delhi', '', '');
    const roiZone = stateToZones('Maharashtra', 'Nashik', 'Nashik');

    const trackonDoc = courierCost('trackon_exp', delhiZone, 0.75);
    const b2bSurface = courierCost('b2b', roiZone, 10);

    expect(trackonDoc.total).toBeGreaterThan(trackonDoc.base);
    expect(trackonDoc.fscPct).toContain('23%');
    expect(b2bSurface.total).toBeGreaterThan(0);
    expect(b2bSurface.notes).toContain('MCW 20kg applied');
  });

  it('returns null for products below minimum chargeable weights', () => {
    const zone = stateToZones('Tamil Nadu', 'Chennai', 'Chennai');

    expect(courierCost('dtdc_dsfc', zone, 2.5)).toBeNull();
    expect(courierCost('bluedart_sfc', zone, 2)).toBeNull();
    expect(courierCost('trackon_air', zone, 2.5)).toBeNull();
  });

  it('builds proposal sell pricing for doc, surface, and air', () => {
    const docZone = stateToZones('Delhi', '', '');
    const surfaceZone = stateToZones('Punjab', 'Ludhiana', 'Ludhiana');
    const airZone = stateToZones('Jammu And Kashmir', 'Srinagar', 'Srinagar');

    const docSell = proposalSell(docZone, 0.5, 'doc', 'economy');
    const surfaceSell = proposalSell(surfaceZone, 8, 'surface', 'premium');
    const airSell = proposalSell(airZone, 6, 'air');

    expect(docSell.source).toContain('Economy');
    expect(surfaceSell.source).toContain('Premium');
    expect(airSell.source).toBe('Proposal (Air)');
    expect(surfaceSell.total).toBeGreaterThan(surfaceSell.base);
  });

  it('exposes courier metadata and rate-age information', () => {
    expect(COURIERS.some((courier) => courier.id === 'dtdc_d71')).toBe(true);
    expect(COURIER_TO_PARTNER.trackon_pt).toBe('primetrack');
    expect(RATE_VALIDITY.dtdc.label).toBe('01 Jan 2024');

    const age = getRateAge('dtdc_d71');
    expect(age.days).toBeGreaterThan(0);
    expect(typeof age.stale).toBe('boolean');
  });
});
