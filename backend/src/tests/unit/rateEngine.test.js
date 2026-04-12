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

const rnd = (n) => Math.round(n * 100) / 100;

// ═══════════════════════════════════════════════════════════════════
//  ZONE MAPPING — stateToZones()
// ═══════════════════════════════════════════════════════════════════
describe('rateEngine — stateToZones()', () => {
  it('maps Delhi to correct zones', () => {
    const z = stateToZones('Delhi', '', '');
    expect(z.trackon).toBe('delhi');
    expect(z.delhivery).toBe('A');
    expect(z.dtdc).toBe('local');
    expect(z.b2b).toBe('N1');
    expect(z.seahawkZone).toBe('Delhi & NCR');
  });

  it('maps NCR (Haryana — Gurugram)', () => {
    const z = stateToZones('Haryana', 'Gurugram', '');
    expect(z.trackon).toBe('ncr');
    expect(z.delhivery).toBe('A');
    expect(z.seahawkZone).toBe('Delhi & NCR');
  });

  it('maps NCR (UP — Ghaziabad)', () => {
    const z = stateToZones('Uttar Pradesh', 'Ghaziabad', '');
    expect(z.trackon).toBe('ncr');
    expect(z.delhivery).toBe('A');
  });

  it('maps North India major cities (Jaipur)', () => {
    const z = stateToZones('Rajasthan', '', 'Jaipur');
    expect(z.trackon).toBe('north_cities');
    expect(z.delhivery).toBe('B');
    expect(z.seahawkZone).toBe('North India');
  });

  it('maps North India minor state (Jodhpur)', () => {
    const z = stateToZones('Rajasthan', 'Jodhpur', 'Jodhpur');
    expect(z.trackon).toBe('north_state');
    expect(z.delhivery).toBe('B');
  });

  it('maps Mumbai as Metro', () => {
    const z = stateToZones('Maharashtra', '', 'Mumbai');
    expect(z.trackon).toBe('metro');
    expect(z.delhivery).toBe('C');
    expect(z.dtdc).toBe('metro');
    expect(z.seahawkZone).toBe('Metro Cities');
  });

  it('maps Bangalore as Metro', () => {
    const z = stateToZones('Karnataka', 'Bengaluru', 'Bangalore');
    expect(z.trackon).toBe('metro');
    expect(z.delhivery).toBe('C');
  });

  it('maps Chennai as Metro', () => {
    const z = stateToZones('Tamil Nadu', 'Chennai', 'Chennai');
    expect(z.trackon).toBe('metro');
    expect(z.seahawkZone).toBe('Metro Cities');
  });

  it('maps Kolkata as Metro', () => {
    const z = stateToZones('West Bengal', 'Kolkata', 'Kolkata');
    expect(z.trackon).toBe('metro');
    expect(z.delhivery).toBe('C');
  });

  it('maps Hyderabad as Metro', () => {
    const z = stateToZones('Telangana', 'Hyderabad', 'Hyderabad');
    expect(z.trackon).toBe('metro');
    expect(z.dtdc).toBe('metro');
  });

  it('maps NE — Assam', () => {
    const z = stateToZones('Assam', '', '');
    expect(z.trackon).toBe('ne');
    expect(z.delhivery).toBe('E');
    expect(z.seahawkZone).toBe('North East');
  });

  it('maps NE — Manipur as Delhivery F', () => {
    const z = stateToZones('Manipur', '', '');
    expect(z.delhivery).toBe('F');
  });

  it('maps Tripura to NE', () => {
    const z = stateToZones('Tripura', 'West Tripura', 'Agartala');
    expect(z.trackon).toBe('ne');
    expect(z.gec).toBe('ne_iii');
  });

  it('maps Andaman to special zone', () => {
    const z = stateToZones('Andaman and Nicobar Islands', '', 'Port Blair');
    expect(z.trackon).toBe('port_blair');
    expect(z.delhivery).toBe('F');
    expect(z.pt).toBe('spl');
  });

  it('maps J&K Srinagar correctly', () => {
    const z = stateToZones('Jammu and Kashmir', 'Srinagar', 'Srinagar');
    expect(z.trackon).toBe('metro');
    expect(z.delhivery).toBe('E');
    expect(z.trackon_air).toBe('srinagar_air');
  });

  it('maps J&K non-Srinagar as north_state', () => {
    const z = stateToZones('Jammu and Kashmir', 'Jammu', 'Jammu');
    expect(z.trackon).toBe('north_state');
  });

  it('maps Himachal Pradesh as north_state', () => {
    const z = stateToZones('Himachal Pradesh', 'Shimla', 'Shimla');
    expect(z.trackon).toBe('north_state');
    expect(z.delhivery).toBe('E');
    expect(z.seahawkZone).toBe('North India');
  });

  it('maps Ladakh properly', () => {
    const z = stateToZones('Ladakh', '', '');
    expect(z.trackon).toBe('ne');
    expect(z.delhivery).toBe('F');
  });

  it('maps Bihar — Patna as major', () => {
    const z = stateToZones('Bihar', 'Patna', 'Patna');
    expect(z.ltl).toBe('e1');
    expect(z.gec).toBe('east_i');
  });

  it('maps Bihar — minor as east_ii', () => {
    const z = stateToZones('Bihar', 'Gaya', 'Gaya');
    expect(z.ltl).toBe('e2');
    expect(z.gec).toBe('east_ii');
  });

  it('maps MP — Bhopal as major', () => {
    const z = stateToZones('Madhya Pradesh', 'Bhopal', 'Bhopal');
    expect(z.gec).toBe('central_i');
  });

  it('maps Odisha — Bhubaneswar', () => {
    const z = stateToZones('Odisha', 'Khurda', 'Bhubaneswar');
    expect(z.gec).toBe('east_i');
  });

  it('maps Gujarat — Ahmedabad as Metro', () => {
    const z = stateToZones('Gujarat', 'Ahmedabad', 'Ahmedabad');
    expect(z.delhivery).toBe('C');
    expect(z.seahawkZone).toBe('Metro Cities');
  });

  it('maps Goa as ROI', () => {
    const z = stateToZones('Goa', '', '');
    expect(z.trackon).toBe('south_west');
    expect(z.seahawkZone).toBe('Rest of India');
  });

  it('maps Kerala as south_west / ROI', () => {
    const z = stateToZones('Kerala', '', '');
    expect(z.trackon).toBe('south_west');
    expect(z.seahawkZone).toBe('Rest of India');
  });

  it('is case-insensitive', () => {
    expect(stateToZones('DELHI', '', '').trackon).toBe('delhi');
    expect(stateToZones('delhi', '', '').trackon).toBe('delhi');
  });

  it('returns fallback for unknown states', () => {
    const z = stateToZones('Atlantis', '', '');
    expect(z.trackon).toBe('south_west');
    expect(z.seahawkZone).toBe('Rest of India');
  });
});


// ═══════════════════════════════════════════════════════════════════
//  COURIER COST — courierCost()
// ═══════════════════════════════════════════════════════════════════
describe('rateEngine — courierCost()', () => {
  const delhi  = stateToZones('Delhi', '', '');
  const mumbai = stateToZones('Maharashtra', '', 'Mumbai');
  const ne     = stateToZones('Assam', '', '');
  const north  = stateToZones('Punjab', 'Ludhiana', 'Ludhiana');
  const roi    = stateToZones('Maharashtra', 'Nashik', 'Nashik');
  const localBd = stateToZones('Delhi', '', '');

  // ── Trackon Express ────────────────────────────────────────
  describe('Trackon Express', () => {
    it('250g Delhi', () => {
      const r = courierCost('trackon_exp', delhi, 0.25);
      expect(r.base).toBe(12.5); // ceil05(0.25)=0.5 → w500 rate
      expect(r.fscPct).toContain('23%');
      expect(r.fsc).toBe(rnd(12.5 * 0.23));
      expect(r.gst).toBe(rnd(r.subtotal * 0.18));
    });

    it('500g Delhi', () => {
      const r = courierCost('trackon_exp', delhi, 0.5);
      expect(r.base).toBe(12.5);
    });

    it('1.5kg Delhi (addl slabs)', () => {
      const r = courierCost('trackon_exp', delhi, 1.5);
      // ceil05(1.5)=1.5, base = w500 + ceil((1.5-0.5)/0.5)*addl = 12.5+2*6 = 24.5
      expect(r.base).toBe(24.5);
    });

    it('NE is more expensive than Delhi', () => {
      const rD = courierCost('trackon_exp', delhi, 1);
      const rN = courierCost('trackon_exp', ne, 1);
      expect(rN.total).toBeGreaterThan(rD.total);
    });
  });

  // ── Trackon Surface ────────────────────────────────────────
  describe('Trackon Surface', () => {
    it('null for < 3kg', () => {
      expect(courierCost('trackon_sfc', delhi, 2)).toBeNull();
    });

    it('5kg Delhi', () => {
      const r = courierCost('trackon_sfc', delhi, 5);
      expect(r.base).toBe(60); // 5 * s3(12)
    });

    it('MCW 3kg applied at exactly 3kg', () => {
      const r = courierCost('trackon_sfc', delhi, 3);
      expect(r.base).toBe(36); // 3*12
    });
  });

  // ── Trackon Air Cargo ──────────────────────────────────────
  describe('Trackon Air Cargo', () => {
    it('null for < 3kg', () => {
      expect(courierCost('trackon_air', delhi, 2)).toBeNull();
    });

    it('6kg North', () => {
      const r = courierCost('trackon_air', north, 6);
      expect(r).not.toBeNull();
      expect(r.fscPct).toBe('23%');
      expect(r.total).toBeGreaterThan(0);
    });
  });

  // ── Trackon Prime Track ────────────────────────────────────
  describe('Trackon Prime Track', () => {
    it('250g city', () => {
      const r = courierCost('trackon_pt', delhi, 0.25);
      expect(r.base).toBe(16); // city w500=16 since ceil05(0.25)=0.5
      expect(r.docket).toBe(35);
      expect(r.fscPct).toBe('None');
    });

    it('2.5kg zone', () => {
      const r = courierCost('trackon_pt', delhi, 2.5);
      expect(r).not.toBeNull();
      expect(r.total).toBeGreaterThan(0);
    });
  });

  // ── Delhivery Standard ─────────────────────────────────────
  describe('Delhivery Standard', () => {
    it('250g Zone A', () => {
      const r = courierCost('delhivery_std', delhi, 0.25);
      expect(r).not.toBeNull();
      expect(r.fscPct).toBe('None');
    });

    it('2kg Zone C (Mumbai)', () => {
      const r = courierCost('delhivery_std', mumbai, 2);
      expect(r).not.toBeNull();
      expect(r.total).toBeGreaterThan(0);
    });

    it('1.5kg Zone C (Mumbai) uses correct slab', () => {
      const r = courierCost('delhivery_std', mumbai, 1.5);
      expect(r).not.toBeNull();
    });
  });

  // ── Delhivery Express ──────────────────────────────────────
  describe('Delhivery Express', () => {
    it('500g correctly', () => {
      const r = courierCost('delhivery_exp', delhi, 0.5);
      expect(r).not.toBeNull();
    });

    it('2kg with addl', () => {
      const r = courierCost('delhivery_exp', delhi, 2);
      expect(r).not.toBeNull();
      expect(r.total).toBeGreaterThan(0);
    });
  });

  // ── B2B ────────────────────────────────────────────────────
  describe('B2B Courier', () => {
    it('MCW 20kg enforced', () => {
      const r = courierCost('b2b', delhi, 5);
      expect(r.mcwApplied).toBe(true);
      expect(r.notes).toContain('MCW 20kg applied');
    });

    it('docket charge ₹250', () => {
      const r = courierCost('b2b', delhi, 25);
      expect(r.docket).toBe(250);
    });

    it('min freight ₹350 applied', () => {
      const r = courierCost('b2b', delhi, 1);
      expect(r.notes).toEqual(expect.arrayContaining([expect.stringMatching(/Min freight/)]));
    });

    it('green tax exists', () => {
      const r = courierCost('b2b', roi, 25);
      expect(r.green).toBeGreaterThanOrEqual(100);
    });

    it('FSC 15%', () => {
      const r = courierCost('b2b', roi, 25);
      expect(r.fscPct).toBe('15%');
    });
  });

  // ── DTDC family ────────────────────────────────────────────
  describe('DTDC D71', () => {
    it('500g', () => {
      const r = courierCost('dtdc_d71', delhi, 0.5);
      expect(r).not.toBeNull();
      expect(r.fscPct).toBe('35%');
    });

    it('5kg (pkg slab)', () => {
      const r = courierCost('dtdc_d71', mumbai, 5);
      expect(r.total).toBeGreaterThan(0);
    });
  });

  describe('DTDC V71', () => {
    it('500g', () => {
      const r = courierCost('dtdc_v71', delhi, 0.5);
      expect(r).not.toBeNull();
      expect(r.fscPct).toBe('35%');
    });
  });

  describe('DTDC P7X', () => {
    it('4kg ROI', () => {
      const r = courierCost('dtdc_p7x', roi, 4);
      expect(r).not.toBeNull();
      expect(r.total).toBeGreaterThan(0);
    });
  });

  describe('DTDC Express', () => {
    it('250g', () => {
      const r = courierCost('dtdc_exp', delhi, 0.25);
      expect(r).not.toBeNull();
    });
  });

  describe('DTDC D-Surface', () => {
    it('null for < 3kg', () => {
      expect(courierCost('dtdc_dsfc', delhi, 2)).toBeNull();
    });

    it('10kg works', () => {
      const r = courierCost('dtdc_dsfc', roi, 10);
      expect(r).not.toBeNull();
    });
  });

  describe('DTDC D-Air', () => {
    it('null for < 3kg', () => {
      expect(courierCost('dtdc_dair', delhi, 2)).toBeNull();
    });

    it('5kg NE', () => {
      const r = courierCost('dtdc_dair', ne, 5);
      expect(r).not.toBeNull();
    });
  });

  // ── BlueDart family ────────────────────────────────────────
  describe('BlueDart Express', () => {
    it('500g', () => {
      const r = courierCost('bluedart_exp', mumbai, 0.5);
      expect(r).not.toBeNull();
      expect(r.fscPct).toBe('35%');
    });
  });

  describe('BlueDart Air', () => {
    it('null for < 3kg', () => {
      expect(courierCost('bluedart_air', delhi, 2)).toBeNull();
    });

    it('6kg Metro', () => {
      const r = courierCost('bluedart_air', mumbai, 6);
      expect(r).not.toBeNull();
    });
  });

  describe('BlueDart Surface', () => {
    it('null below MCW', () => {
      expect(courierCost('bluedart_sfc', delhi, 2)).toBeNull();
    });

    it('6kg local', () => {
      const r = courierCost('bluedart_sfc', localBd, 6);
      expect(r).not.toBeNull();
    });
  });

  // ── GEC & LTL ─────────────────────────────────────────────
  describe('GEC Surface', () => {
    it('null for < 1kg', () => {
      expect(courierCost('gec_sfc', delhi, 0.5)).toBeNull();
    });

    it('MCW 50kg', () => {
      const r = courierCost('gec_sfc', roi, 10);
      expect(r.mcwApplied).toBe(true);
    });

    it('55kg ROI — no MCW', () => {
      const r = courierCost('gec_sfc', roi, 55);
      expect(r.mcwApplied).toBe(false);
    });
  });

  describe('LTL Road', () => {
    it('null for < 1kg', () => {
      expect(courierCost('ltl_road', delhi, 0.5)).toBeNull();
    });

    it('MCW 40kg', () => {
      const r = courierCost('ltl_road', roi, 10);
      expect(r.mcwApplied).toBe(true);
      expect(r.notes).toEqual(expect.arrayContaining([expect.stringMatching(/MCW 40kg/)]));
    });

    it('60kg ROI — env charge present', () => {
      const r = courierCost('ltl_road', roi, 60);
      expect(r.notes).toEqual(expect.arrayContaining([expect.stringMatching(/Env.*charge/)]));
    });
  });

  // ── Unknown courier ────────────────────────────────────────
  it('returns null for unknown courier ID', () => {
    expect(courierCost('unknown_courier', delhi, 1)).toBeNull();
  });

  // ── Full matrix: every courier at a valid weight ───────────
  describe('Full courier catalogue coverage', () => {
    const scenarios = [
      ['trackon_exp', delhi, 0.5],
      ['trackon_sfc', north, 5],
      ['trackon_air', north, 6],
      ['trackon_pt', delhi, 2.5],
      ['delhivery_std', mumbai, 1.5],
      ['delhivery_exp', roi, 1],
      ['b2b', roi, 25],
      ['dtdc_d71', roi, 3.5],
      ['dtdc_v71', roi, 1],
      ['dtdc_p7x', roi, 4],
      ['dtdc_exp', delhi, 0.5],
      ['dtdc_dsfc', roi, 4],
      ['dtdc_dair', ne, 5],
      ['gec_sfc', roi, 55],
      ['ltl_road', roi, 60],
      ['bluedart_exp', mumbai, 0.5],
      ['bluedart_air', mumbai, 6],
      ['bluedart_sfc', localBd, 6],
    ];

    for (const [id, zone, w] of scenarios) {
      it(`${id} @ ${w}kg → valid total`, () => {
        const r = courierCost(id, zone, w);
        expect(r, id).not.toBeNull();
        expect(r.total, id).toBeGreaterThan(0);
        expect(r.gst, id).toBeGreaterThanOrEqual(0);
      });
    }
  });

  // ── GST is always 18% on subtotal ─────────────────────────
  it('GST = 18% of subtotal', () => {
    const r = courierCost('trackon_exp', delhi, 1);
    expect(r.gst).toBe(rnd(r.subtotal * 0.18));
    expect(r.total).toBe(rnd(r.subtotal + r.gst + r.oda));
  });
});


// ═══════════════════════════════════════════════════════════════════
//  PROPOSAL SELL — proposalSell()
// ═══════════════════════════════════════════════════════════════════
describe('rateEngine — proposalSell()', () => {
  const delhi = stateToZones('Delhi', '', '');
  const ne    = stateToZones('Assam', '', '');

  describe('Document (doc)', () => {
    it('economy 250g Delhi → base ₹25', () => {
      const r = proposalSell(delhi, 0.25, 'doc', 'economy');
      expect(r.base).toBe(25); // ceil05(0.25)=0.5 → w500 rate
      expect(r.fscPct).toBe('25%');
      expect(r.source).toContain('Economy');
    });

    it('premium 500g Delhi → base ₹38', () => {
      const r = proposalSell(delhi, 0.5, 'doc', 'premium');
      expect(r.base).toBe(38);
      expect(r.source).toContain('Premium');
    });

    it('2kg economy Delhi (addl slabs)', () => {
      const r = proposalSell(delhi, 2, 'doc', 'economy');
      expect(r.base).toBe(61); // w500(25) + ceil((2-0.5)/0.5)*12 = 25+36 = 61
    });

    it('FSC=25%, GST=18%', () => {
      const r = proposalSell(delhi, 0.5, 'doc', 'economy');
      expect(r.fsc).toBe(rnd(r.base * 0.25));
      expect(r.gst).toBe(rnd((r.base + r.fsc) * 0.18));
    });
  });

  describe('Surface', () => {
    it('null for < 3kg', () => {
      expect(proposalSell(delhi, 2, 'surface')).toBeNull();
    });

    it('5kg delhi economy', () => {
      const r = proposalSell(delhi, 5, 'surface', 'economy');
      expect(r.base).toBe(110); // max(5,3)*22 = 5*22
    });

    it('NE more expensive than Delhi', () => {
      const rD = proposalSell(delhi, 10, 'surface', 'economy');
      const rN = proposalSell(ne, 10, 'surface', 'economy');
      expect(rN.total).toBeGreaterThan(rD.total);
    });

    it('premium 8kg', () => {
      const r = proposalSell(delhi, 8, 'surface', 'premium');
      expect(r.source).toContain('Premium');
      expect(r.total).toBeGreaterThan(r.base);
    });
  });

  describe('Air', () => {
    it('null for < 3kg', () => {
      expect(proposalSell(delhi, 2, 'air')).toBeNull();
    });

    it('6kg air', () => {
      const r = proposalSell(delhi, 6, 'air');
      expect(r.source).toBe('Proposal (Air)');
      expect(r.total).toBeGreaterThan(0);
    });
  });

  describe('Unknown type', () => {
    it('returns null', () => {
      expect(proposalSell(delhi, 1, 'rocket')).toBeNull();
      expect(proposalSell(delhi, 1, 'unknown')).toBeNull();
    });
  });
});


// ═══════════════════════════════════════════════════════════════════
//  METADATA — COURIERS, RATE_VALIDITY, getRateAge
// ═══════════════════════════════════════════════════════════════════
describe('rateEngine — metadata', () => {
  it('COURIERS has all 18 entries', () => {
    expect(COURIERS.length).toBe(18);
  });

  it('every courier has id, label, group, types', () => {
    for (const c of COURIERS) {
      expect(c.id).toBeDefined();
      expect(c.label).toBeDefined();
      expect(c.group).toBeDefined();
      expect(Array.isArray(c.types)).toBe(true);
    }
  });

  it('COURIER_TO_PARTNER maps correctly', () => {
    expect(COURIER_TO_PARTNER.trackon_pt).toBe('primetrack');
    expect(COURIER_TO_PARTNER.dtdc_d71).toBe('dtdc');
    expect(COURIER_TO_PARTNER.bluedart_exp).toBe('bluedart');
  });

  it('RATE_VALIDITY has labels', () => {
    expect(RATE_VALIDITY.dtdc.label).toBe('01 Jan 2024');
    expect(RATE_VALIDITY.trackon.label).toBe('01 Apr 2025');
  });

  it('getRateAge returns days and stale flag', () => {
    const age = getRateAge('dtdc_d71');
    expect(age.days).toBeGreaterThan(0);
    expect(typeof age.stale).toBe('boolean');
  });

  it('getRateAge handles unknown courier gracefully', () => {
    const age = getRateAge('nonexistent');
    expect(age.days).toBe(0);
    expect(age.stale).toBe(false);
  });
});
