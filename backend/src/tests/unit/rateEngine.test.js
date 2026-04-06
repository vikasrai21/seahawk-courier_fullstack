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

  it('maps a broad mix of state and district combinations into expected zones', () => {
    expect(stateToZones('Haryana', 'Gurugram', 'Gurugram').trackon).toBe('ncr');
    expect(stateToZones('Uttar Pradesh', 'Ghaziabad', 'Ghaziabad').delhivery).toBe('A');
    expect(stateToZones('Tripura', 'West Tripura', 'Agartala').gec).toBe('ne_iii');
    expect(stateToZones('Andaman and Nicobar Islands', '', 'Port Blair').pt).toBe('spl');
    expect(stateToZones('Jammu and Kashmir', 'Srinagar', 'Srinagar').trackon_air).toBe('srinagar_air');
    expect(stateToZones('Himachal Pradesh', 'Shimla', 'Shimla').seahawkZone).toBe('North India');
    expect(stateToZones('Bihar', 'Patna', 'Patna').ltl).toBe('e1');
    expect(stateToZones('Madhya Pradesh', 'Bhopal', 'Bhopal').gec).toBe('central_i');
    expect(stateToZones('Odisha', 'Khurda', 'Bhubaneswar').gec).toBe('east_i');
    expect(stateToZones('West Bengal', 'Kolkata', 'Kolkata').delhivery).toBe('C');
    expect(stateToZones('Maharashtra', 'Mumbai', 'Mumbai').b2b).toBe('W2');
    expect(stateToZones('Telangana', 'Hyderabad', 'Hyderabad').ltl).toBe('s1');
    expect(stateToZones('Karnataka', 'Bengaluru', 'Bengaluru').delhivery).toBe('C');
    expect(stateToZones('Tamil Nadu', 'Chennai', 'Chennai').seahawkZone).toBe('Metro Cities');
    expect(stateToZones('Unknown State', '', '').seahawkZone).toBe('Rest of India');
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

  it('calculates costs across the supported courier catalogue', () => {
    const zones = {
      delhi: stateToZones('Delhi', '', ''),
      north: stateToZones('Punjab', 'Ludhiana', 'Ludhiana'),
      metro: stateToZones('Tamil Nadu', 'Chennai', 'Chennai'),
      roi: stateToZones('Maharashtra', 'Nashik', 'Nashik'),
      ne: stateToZones('Assam', 'Kamrup', 'Guwahati'),
      localBd: stateToZones('Delhi', '', ''),
    };

    const scenarios = [
      ['trackon_exp', zones.delhi, 0.5],
      ['trackon_sfc', zones.north, 5],
      ['trackon_air', zones.north, 6],
      ['trackon_pt', zones.delhi, 2.5],
      ['delhivery_std', zones.metro, 1.5],
      ['delhivery_exp', zones.roi, 1],
      ['b2b', zones.roi, 25],
      ['dtdc_d71', zones.roi, 3.5],
      ['dtdc_v71', zones.roi, 1],
      ['dtdc_p7x', zones.roi, 4],
      ['dtdc_exp', zones.delhi, 0.5],
      ['dtdc_dsfc', zones.roi, 4],
      ['dtdc_dair', zones.ne, 5],
      ['gec_sfc', zones.roi, 55],
      ['ltl_road', zones.roi, 60],
      ['bluedart_exp', zones.metro, 0.5],
      ['bluedart_air', zones.metro, 6],
      ['bluedart_sfc', zones.localBd, 6],
    ];

    for (const [courierId, zone, weight] of scenarios) {
      const result = courierCost(courierId, zone, weight);
      expect(result, courierId).not.toBeNull();
      expect(result.total, courierId).toBeGreaterThan(0);
      expect(result.gst, courierId).toBeGreaterThanOrEqual(0);
    }

    expect(courierCost('unknown_courier', zones.delhi, 1)).toBeNull();
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

  it('returns null for unsupported proposal sell combinations and preserves metadata coverage', () => {
    const zone = stateToZones('Delhi', '', '');

    expect(proposalSell(zone, 2, 'surface')).toBeNull();
    expect(proposalSell(zone, 2, 'air')).toBeNull();
    expect(proposalSell(zone, 1, 'unknown')).toBeNull();
    expect(COURIERS.length).toBeGreaterThan(10);
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
