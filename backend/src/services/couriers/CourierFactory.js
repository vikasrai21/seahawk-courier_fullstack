'use strict';
// CourierFactory.js — Multi-courier abstraction layer
// Providers: Delhivery, DTDC, BlueDart, Trackon, Primtrack
// Add new couriers by extending ICourierProvider and registering below

const logger = require('../../utils/logger');

// ─────────────────────────────────────────────────────────────
// BASE PROVIDER
// ─────────────────────────────────────────────────────────────
class ICourierProvider {
  get name()    { throw new Error('name not implemented'); }
  get enabled() { return false; }
  async createShipment(payload)            { throw new Error(`${this.name}: createShipment not implemented`); }
  async trackShipment(awb)                 { throw new Error(`${this.name}: trackShipment not implemented`); }
  async cancelShipment(awb)                { throw new Error(`${this.name}: cancelShipment not implemented`); }
  async getLabel(awb)                      { throw new Error(`${this.name}: getLabel not implemented`); }
  async calculateRate(payload)             { throw new Error(`${this.name}: calculateRate not implemented`); }
  async checkServiceability(originPin, destPin) { throw new Error(`${this.name}: checkServiceability not implemented`); }
}

// ─────────────────────────────────────────────────────────────
// DELHIVERY PROVIDER
// ─────────────────────────────────────────────────────────────
class DelhiveryProvider extends ICourierProvider {
  get name()    { return 'Delhivery'; }
  get enabled() { return !!process.env.DELHIVERY_API_KEY; }
  get baseUrl() { return process.env.DELHIVERY_API_URL || 'https://track.delhivery.com'; }

  _headers() {
    return { Authorization: `Token ${process.env.DELHIVERY_API_KEY}`, 'Content-Type': 'application/json' };
  }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, deliveryState, pincode, weight, codAmount, productName } = payload;
    const body = {
      format: 'json',
      data: JSON.stringify({
        shipments: [{
          waybill: awb, name: consignee, add: deliveryAddress, city: deliveryCity,
          state: deliveryState, country: 'India', phone,
          pin: String(pincode), payment_mode: codAmount > 0 ? 'COD' : 'Pre-paid',
          cod_amount: codAmount || 0, weight: (weight || 0.5) * 1000,
          products_desc: productName || 'Goods',
          seller_name: process.env.DELHIVERY_SELLER_NAME || 'Sea Hawk Courier',
          seller_add:  process.env.DELHIVERY_SELLER_ADDRESS || 'Gurugram, Haryana',
          seller_city: process.env.DELHIVERY_SELLER_CITY || 'Gurugram',
          seller_pin:  process.env.DELHIVERY_SELLER_PIN || '122015',
        }],
        pickup_location: { name: process.env.DELHIVERY_WAREHOUSE || 'Primary' },
      }),
    };
    const res = await fetch(`${this.baseUrl}/api/cmu/create.json`, {
      method: 'POST', headers: { ...this._headers(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(), signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.rmk || 'Delhivery shipment creation failed');
    return { awb, labelUrl: `${this.baseUrl}/api/p/packing_slip?wbns=${awb}&pdf=true`, courier: 'Delhivery' };
  }

  async trackShipment(awb) {
    const res = await fetch(`${this.baseUrl}/api/v1/packages/json/?waybill=${awb}&verbose=1`,
      { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Delhivery tracking failed: ${res.status}`);
    const data = await res.json();
    const s = data?.ShipmentData?.[0]?.Shipment;
    if (!s) throw new Error(`AWB ${awb} not found on Delhivery`);
    const events = (s.Scans || []).map(sc => ({
      status: sc.ScanDetail?.Scan || sc.ScanDetail?.Instructions || 'Update',
      location: sc.ScanDetail?.ScannedLocation || '',
      description: sc.ScanDetail?.Instructions || '',
      timestamp: sc.ScanDetail?.ScanDateTime ? new Date(sc.ScanDetail.ScanDateTime) : new Date(),
    }));
    return { status: this._mapStatus(s.Status), expectedDelivery: s.ExpectedDeliveryDate || null, events };
  }

  async cancelShipment(awb) {
    const res = await fetch(`${this.baseUrl}/api/p/edit`, {
      method: 'POST', headers: this._headers(),
      body: JSON.stringify({ waybill: awb, cancellation: true }), signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return { success: data.success, message: data.rmk };
  }

  async getLabel(awb) { return { url: `${this.baseUrl}/api/p/packing_slip?wbns=${awb}&pdf=true`, type: 'url' }; }

  async calculateRate({ originPin, destPin, weight, cod }) {
    const params = new URLSearchParams({ md: 'S', ss: 'Delivered', d_pin: destPin, o_pin: originPin, cgm: Math.round((weight || 0.5) * 1000), pt: cod ? 'COD' : 'Pre-paid', cod: cod || 0 });
    const res = await fetch(`${this.baseUrl}/api/kinko/v1/invoice/charges/?${params}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    const res = await fetch(`${this.baseUrl}/c/api/pin-codes/json/?filter_codes=${destPin}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { courier: 'Delhivery', serviceable: data?.delivery_codes?.length > 0, destPin };
  }

  _mapStatus(s) {
    const map = { 'In Transit': 'In Transit', 'Delivered': 'Delivered', 'Pending Pickup': 'Booked', 'Picked Up': 'Picked Up', 'Out for Delivery': 'Out for Delivery', 'RTO': 'RTO', 'RTO Initiated': 'RTO' };
    return map[s] || s;
  }
}

// ─────────────────────────────────────────────────────────────
// DTDC PROVIDER
// ─────────────────────────────────────────────────────────────
class DTDCProvider extends ICourierProvider {
  get name()    { return 'DTDC'; }
  get enabled() { return !!process.env.DTDC_CUSTOMER_CODE && !!process.env.DTDC_API_KEY; }
  get baseUrl() { return process.env.DTDC_API_URL || 'http://blktapi.dtdc.com'; }

  _headers() { return { 'APPKEY': process.env.DTDC_API_KEY, 'Content-Type': 'application/json' }; }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, deliveryState, pincode, weight, codAmount } = payload;
    const res = await fetch(`${this.baseUrl}/dtdcConnectRestApi/api/v1/addShipment`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        cnno: awb, refno: awb, custId: process.env.DTDC_CUSTOMER_CODE,
        noOfPcs: 1, shipType: codAmount > 0 ? 'COD' : 'Non-document',
        grossWt: weight || 0.5, CodAmt: codAmount || 0,
        consigneeDetails: { cneeName: consignee, cneeAdd1: deliveryAddress, cneeCity: deliveryCity, cneeState: deliveryState, cneePincode: String(pincode), cneeMobile: phone },
      }),
    });
    if (!res.ok) throw new Error(`DTDC API error: ${res.status}`);
    const data = await res.json();
    return { awb, labelUrl: data?.labelUrl || null, courier: 'DTDC' };
  }

  async trackShipment(awb) {
    const res = await fetch(`${this.baseUrl}/dtdcConnectRestApi/api/v1/trackSingle/${awb}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`DTDC tracking failed: ${res.status}`);
    const data = await res.json();
    return {
      status: data?.shipmentStatus || 'Unknown',
      events: (data?.trackDetails || []).map(e => ({ status: e.status || '', location: e.location || '', timestamp: e.dateTime ? new Date(e.dateTime) : new Date() })),
    };
  }

  async cancelShipment(awb) {
    const res = await fetch(`${this.baseUrl}/dtdcConnectRestApi/api/v1/cancelShipment/${awb}`, { method: 'DELETE', headers: this._headers(), signal: AbortSignal.timeout(10000) });
    return { success: res.ok, message: res.ok ? 'Cancelled' : 'Cancellation failed' };
  }

  async getLabel(awb) { return { url: `${this.baseUrl}/dtdcConnectRestApi/api/v1/getLabel/${awb}`, type: 'url' }; }

  async calculateRate({ originPin, destPin, weight, cod }) {
    const res = await fetch(`${this.baseUrl}/dtdcConnectRestApi/api/v1/calculateRate`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ custId: process.env.DTDC_CUSTOMER_CODE, pinCodeFrom: originPin, pinCodeTo: destPin, weight: weight || 0.5, codAmount: cod || 0 }),
    });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    const res = await fetch(`${this.baseUrl}/dtdcConnectRestApi/api/v1/checkServiceability?pinCodeFrom=${originPin}&pinCodeTo=${destPin}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { courier: 'DTDC', serviceable: !!data?.serviceable, destPin };
  }
}

// ─────────────────────────────────────────────────────────────
// BLUEDART PROVIDER
// ─────────────────────────────────────────────────────────────
class BlueDartProvider extends ICourierProvider {
  get name()    { return 'BlueDart'; }
  get enabled() { return !!process.env.BLUEDART_LICENSE_KEY && !!process.env.BLUEDART_LOGIN_ID; }
  get baseUrl() { return process.env.BLUEDART_API_URL || 'https://apigateway.bluedart.com'; }

  _profile() { return { Api_type: 'S', LicenceKey: process.env.BLUEDART_LICENSE_KEY, LoginID: process.env.BLUEDART_LOGIN_ID }; }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, pincode, weight, codAmount, productName } = payload;
    const res = await fetch(`${this.baseUrl}/in/transportation/waybill/v1/GenerateAWB`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        Profile: this._profile(),
        Consignee: { ConsigneeName: consignee, ConsigneeAddress1: deliveryAddress, ConsigneeAddress2: deliveryCity, ConsigneePincode: String(pincode), ConsigneeMobile: phone },
        ShipmentDetails: { AWBNo: awb, ProductCode: 'D', ActualWeight: weight || 0.5, CollectableAmount: codAmount || 0, CommodityDescription: productName || 'Goods', Dimensions: [{ Breadth: 10, Height: 10, Length: 10, Count: 1 }] },
        Shipper: { OriginArea: process.env.BLUEDART_AREA_CODE || 'Del', ShipperName: 'Sea Hawk Courier & Cargo', ShipperPhone: '9911565523' },
      }),
    });
    if (!res.ok) throw new Error(`BlueDart API error: ${res.status}`);
    const data = await res.json();
    return { awb, labelUrl: data?.LabelUrl || null, courier: 'BlueDart' };
  }

  async trackShipment(awb) {
    const res = await fetch(`${this.baseUrl}/in/transportation/track/v1/getFlightDetails`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ Profile: this._profile(), WaybillNos: [awb], AWBType: 'awb', licKey: process.env.BLUEDART_LICENSE_KEY, noOfResults: 10 }),
    });
    if (!res.ok) throw new Error(`BlueDart tracking failed: ${res.status}`);
    const data = await res.json();
    const scans = data?.TrackingByFlightNoDtls?.[0]?.Scans || [];
    return { status: scans[0]?.ScanCode || 'Unknown', events: scans.map(s => ({ status: s.ScanDescription || '', location: s.ScannedLocation || '', timestamp: s.ScanDate ? new Date(s.ScanDate) : new Date() })) };
  }

  async cancelShipment(awb) { return { success: false, message: 'BlueDart cancellation requires manual intervention. Call 1860-233-1234.' }; }
  async getLabel(awb) { return { url: `${this.baseUrl}/in/transportation/waybill/v1/GenerateLabel?AWB=${awb}`, type: 'url' }; }

  async calculateRate({ originPin, destPin, weight, cod }) {
    const res = await fetch(`${this.baseUrl}/in/transportation/rate/v1/getRateCalculation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ Profile: this._profile(), PIN: destPin, ProductCode: 'D', SubProductCode: 'P', PaymentType: 'P', PieceCount: 1, ActualWeight: weight || 0.5, CollectableAmount: cod || 0, DeclaredValue: 0 }),
    });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    const res = await fetch(`${this.baseUrl}/in/transportation/serviceability/v1/GetServicability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ Profile: this._profile(), pinCode: destPin, productCode: 'D', subProductCode: 'P' }),
    });
    const data = await res.json();
    return { courier: 'BlueDart', serviceable: !!data?.Servicable, destPin };
  }
}

// ─────────────────────────────────────────────────────────────
// TRACKON PROVIDER
// Trackon Couriers — API docs: https://trackon.in/api-docs
// Env vars: TRACKON_CUSTOMER_ID, TRACKON_API_KEY, TRACKON_API_URL
// ─────────────────────────────────────────────────────────────
class TrackonProvider extends ICourierProvider {
  get name()    { return 'Trackon'; }
  get enabled() { return !!process.env.TRACKON_CUSTOMER_ID && !!process.env.TRACKON_API_KEY; }
  get baseUrl() { return process.env.TRACKON_API_URL || 'https://trackon.in/api'; }

  _headers() {
    return {
      'customerId': process.env.TRACKON_CUSTOMER_ID,
      'apiKey':     process.env.TRACKON_API_KEY,
      'Content-Type': 'application/json',
    };
  }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, deliveryState, pincode, weight, codAmount } = payload;
    const res = await fetch(`${this.baseUrl}/booking/create`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        docketNo:        awb,
        consigneeName:   consignee,
        consigneePhone:  phone,
        consigneeAddr:   deliveryAddress,
        consigneeCity:   deliveryCity,
        consigneeState:  deliveryState,
        consigneePincode: String(pincode),
        actualWeight:    weight || 0.5,
        codAmount:       codAmount || 0,
        paymentMode:     codAmount > 0 ? 'COD' : 'PREPAID',
        noOfPcs:         1,
        serviceType:     'D', // D = Door delivery
      }),
    });
    if (!res.ok) throw new Error(`Trackon API error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Trackon booking failed');
    return { awb, labelUrl: data.labelUrl || null, courier: 'Trackon' };
  }

  async trackShipment(awb) {
    const res = await fetch(`${this.baseUrl}/tracking/${awb}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Trackon tracking failed: ${res.status}`);
    const data = await res.json();
    const scans = data?.scans || data?.trackingDetails || [];
    return {
      status: data?.currentStatus || 'Unknown',
      events: scans.map(s => ({
        status:    s.status || s.scanType || '',
        location:  s.location || s.city || '',
        description: s.remarks || s.description || '',
        timestamp: s.scanTime ? new Date(s.scanTime) : new Date(),
      })),
    };
  }

  async cancelShipment(awb) {
    const res = await fetch(`${this.baseUrl}/booking/cancel`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ docketNo: awb }),
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  }

  async getLabel(awb) {
    return { url: `${this.baseUrl}/label/${awb}`, type: 'url' };
  }

  async calculateRate({ originPin, destPin, weight, cod }) {
    const res = await fetch(`${this.baseUrl}/rate/calculate`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ fromPin: originPin, toPin: destPin, weight: weight || 0.5, codAmount: cod || 0 }),
    });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    const res = await fetch(`${this.baseUrl}/serviceability?fromPin=${originPin}&toPin=${destPin}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { courier: 'Trackon', serviceable: !!data?.serviceable, destPin };
  }
}

// ─────────────────────────────────────────────────────────────
// PRIMTRACK (PRIMETRACK) PROVIDER
// PrimeTrack Courier — used via your channel partner account
// Env vars: PRIMTRACK_API_KEY, PRIMTRACK_CLIENT_ID, PRIMTRACK_API_URL
// ─────────────────────────────────────────────────────────────
class PrimtrackProvider extends ICourierProvider {
  get name()    { return 'Primtrack'; }
  get enabled() { return !!process.env.PRIMTRACK_API_KEY && !!process.env.PRIMTRACK_CLIENT_ID; }
  get baseUrl() { return process.env.PRIMTRACK_API_URL || 'https://api.primetrack.in'; }

  _headers() {
    return {
      'Authorization': `Bearer ${process.env.PRIMTRACK_API_KEY}`,
      'ClientId':      process.env.PRIMTRACK_CLIENT_ID,
      'Content-Type':  'application/json',
    };
  }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, deliveryState, pincode, weight, codAmount } = payload;
    const res = await fetch(`${this.baseUrl}/v1/shipments/create`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        awbNumber:   awb,
        consignee: {
          name:    consignee,
          phone,
          address: deliveryAddress,
          city:    deliveryCity,
          state:   deliveryState,
          pincode: String(pincode),
        },
        package: {
          weight:     weight || 0.5,
          pieces:     1,
          codAmount:  codAmount || 0,
          paymentMode: codAmount > 0 ? 'COD' : 'PREPAID',
        },
        shipper: {
          name:    process.env.DELHIVERY_SELLER_NAME || 'Sea Hawk Courier & Cargo',
          address: process.env.DELHIVERY_SELLER_ADDRESS || 'Gurugram, Haryana',
          pincode: process.env.DELHIVERY_SELLER_PIN || '122015',
        },
      }),
    });
    if (!res.ok) throw new Error(`Primtrack API error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Primtrack booking failed');
    return { awb, labelUrl: data.data?.labelUrl || null, courier: 'Primtrack' };
  }

  async trackShipment(awb) {
    const res = await fetch(`${this.baseUrl}/v1/shipments/track/${awb}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Primtrack tracking failed: ${res.status}`);
    const data = await res.json();
    const scans = data?.data?.scans || [];
    return {
      status: data?.data?.currentStatus || 'Unknown',
      events: scans.map(s => ({
        status:    s.status || '',
        location:  s.location || '',
        description: s.description || '',
        timestamp: s.timestamp ? new Date(s.timestamp) : new Date(),
      })),
    };
  }

  async cancelShipment(awb) {
    const res = await fetch(`${this.baseUrl}/v1/shipments/cancel/${awb}`, { method: 'DELETE', headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { success: data.success, message: data.message };
  }

  async getLabel(awb) { return { url: `${this.baseUrl}/v1/shipments/label/${awb}`, type: 'url' }; }

  async calculateRate({ originPin, destPin, weight, cod }) {
    const res = await fetch(`${this.baseUrl}/v1/rates/calculate`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ fromPincode: originPin, toPincode: destPin, weight: weight || 0.5, codAmount: cod || 0 }),
    });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    const res = await fetch(`${this.baseUrl}/v1/serviceability?from=${originPin}&to=${destPin}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { courier: 'Primtrack', serviceable: !!data?.data?.serviceable, destPin };
  }
}

// ─────────────────────────────────────────────────────────────
// COURIER FACTORY
// ─────────────────────────────────────────────────────────────
const PROVIDERS = {
  Delhivery: new DelhiveryProvider(),
  DTDC:      new DTDCProvider(),
  BlueDart:  new BlueDartProvider(),
  Trackon:   new TrackonProvider(),
  Primtrack: new PrimtrackProvider(),
};

class CourierFactory {
  static get(courierName) {
    const key = Object.keys(PROVIDERS).find(k => k.toLowerCase() === (courierName || '').toLowerCase());
    const provider = key ? PROVIDERS[key] : null;
    if (!provider) throw new Error(`Unknown courier: "${courierName}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
    if (!provider.enabled) throw new Error(`${courierName} API keys not configured. Add env variables.`);
    return provider;
  }

  static getAll()        { return Object.keys(PROVIDERS); }
  static getConfigured() { return Object.values(PROVIDERS).filter(p => p.enabled).map(p => p.name); }

  static async checkAllServiceability(originPin, destPin) {
    const results = await Promise.allSettled(
      Object.values(PROVIDERS).filter(p => p.enabled).map(p => p.checkServiceability(originPin, destPin))
    );
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
  }

  static async compareRates(payload) {
    const configured = Object.values(PROVIDERS).filter(p => p.enabled);
    if (configured.length === 0) {
      return CourierFactory._internalRates(payload)
        .sort((a, b) => (a.rate?.total || a.rate?.Total || Number.MAX_SAFE_INTEGER) - (b.rate?.total || b.rate?.Total || Number.MAX_SAFE_INTEGER));
    }
    const results = await Promise.allSettled(configured.map(async p => {
      const rate = await p.calculateRate(payload);
      return { courier: p.name, rate };
    }));
    const apiRates = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const internal = CourierFactory._internalRates(payload);
    return [...apiRates, ...internal.filter(r => !apiRates.find(a => a.courier === r.courier))]
      .sort((a, b) => (a.rate?.total || a.rate?.Total || Number.MAX_SAFE_INTEGER) - (b.rate?.total || b.rate?.Total || Number.MAX_SAFE_INTEGER));
  }

  static _internalRates({ weight = 0.5, cod = 0 }) {
    const w = parseFloat(weight) || 0.5;
    const c = cod > 0 ? 40 : 0;
    return [
      { courier: 'Delhivery', rate: { total: Math.round((35 + Math.max(0, w - 0.5) * 25 + c) * 1.18), currency: 'INR', estimated: true } },
      { courier: 'DTDC',      rate: { total: Math.round((40 + Math.max(0, w - 0.5) * 28 + c) * 1.18), currency: 'INR', estimated: true } },
      { courier: 'BlueDart',  rate: { total: Math.round((55 + Math.max(0, w - 0.5) * 35 + c) * 1.18), currency: 'INR', estimated: true } },
      { courier: 'Trackon',   rate: { total: Math.round((30 + Math.max(0, w - 0.5) * 22 + c) * 1.18), currency: 'INR', estimated: true } },
      { courier: 'Primtrack', rate: { total: Math.round((28 + Math.max(0, w - 0.5) * 20 + c) * 1.18), currency: 'INR', estimated: true } },
    ];
  }
}

module.exports = { CourierFactory, DelhiveryProvider, DTDCProvider, BlueDartProvider, TrackonProvider, PrimtrackProvider };
