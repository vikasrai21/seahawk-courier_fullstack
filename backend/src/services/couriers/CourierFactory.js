'use strict';
// CourierFactory.js — Multi-courier abstraction layer
// Providers: Delhivery, DTDC, BlueDart, Trackon, Primtrack
// Add new couriers by extending ICourierProvider and registering below

// ─────────────────────────────────────────────────────────────
// BASE PROVIDER
// ─────────────────────────────────────────────────────────────
class ICourierProvider {
  get name()    { throw new Error('name not implemented'); }
  get enabled() { return false; }
  async createShipment(_payload)           { throw new Error(`${this.name}: createShipment not implemented`); }
  async getShipmentDetails(_awb)           { return null; }
  async trackShipment(_awb)                { throw new Error(`${this.name}: trackShipment not implemented`); }
  async cancelShipment(_awb)               { throw new Error(`${this.name}: cancelShipment not implemented`); }
  async getLabel(_awb)                     { throw new Error(`${this.name}: getLabel not implemented`); }
  async calculateRate(_payload)            { throw new Error(`${this.name}: calculateRate not implemented`); }
  async checkServiceability(_originPin, _destPin) { throw new Error(`${this.name}: checkServiceability not implemented`); }
}

function hasTrackonCredentials() {
  return !!(process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY)
    && !!(process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID)
    && !!process.env.TRACKON_PASSWORD;
}

function firstPresent(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function numericValue(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
}

function normalizeWeightKg(value) {
  const num = numericValue(value);
  if (!num) return null;
  return num > 50 ? Number((num / 1000).toFixed(3)) : num;
}

function compactShipmentDetails(details) {
  const compacted = Object.fromEntries(
    Object.entries(details || {}).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'number') return Number.isFinite(value) && value > 0;
      return String(value).trim().length > 0;
    })
  );
  return Object.keys(compacted).length ? compacted : null;
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

  async _getVerboseShipment(awb) {
    const res = await fetch(`${this.baseUrl}/api/v1/packages/json/?waybill=${awb}&verbose=1`,
      { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Delhivery tracking failed: ${res.status}`);
    const data = await res.json();
    const shipment = data?.ShipmentData?.[0]?.Shipment;
    if (!shipment) throw new Error(`AWB ${awb} not found on Delhivery`);
    return shipment;
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

  async getShipmentDetails(awb) {
    const s = await this._getVerboseShipment(awb);
    const shipTo = s?.Consignee || s?.consignee || {};
    const destination = firstPresent(
      shipTo.city,
      shipTo.City,
      s?.Destination,
      s?.DestinationCity,
      s?.destination_city,
      s?.destination,
      s?.city
    );
    const pincode = firstPresent(
      shipTo.pin,
      shipTo.pincode,
      shipTo.Pin,
      shipTo.Pincode,
      s?.DestinationPinCode,
      s?.DestinationPincode,
      s?.destination_pin,
      s?.pin
    );
    const deliveryAddress = firstPresent(
      shipTo.address,
      shipTo.Address,
      shipTo.add,
      shipTo.Add,
      s?.DestinationAddress,
      s?.destination_address,
      s?.add
    );

    return compactShipmentDetails({
      consignee: firstPresent(
        shipTo.name,
        shipTo.Name,
        shipTo.consignee,
        s?.ConsigneeName,
        s?.ReceiverName,
        s?.name
      ),
      phone: firstPresent(shipTo.phone, shipTo.Phone, shipTo.mobile, shipTo.Mobile, s?.Phone, s?.phone),
      deliveryAddress,
      destination: destination ? String(destination).toUpperCase() : null,
      deliveryState: firstPresent(shipTo.state, shipTo.State, s?.DestinationState, s?.state),
      pincode: pincode ? String(pincode) : null,
      weight: normalizeWeightKg(firstPresent(s?.ChargedWeight, s?.charged_weight, s?.Weight, s?.weight)),
      codAmount: numericValue(s?.CODAmount, s?.cod_amount, s?.CollectableAmount, s?.collectable_amount, s?.InvoiceAmount),
      expectedDelivery: firstPresent(s?.ExpectedDeliveryDate, s?.expectedDelivery, s?.EDD),
      trackingStatus: firstPresent(s?.Status?.Status, s?.Status, s?.status),
    });
  }

  async trackShipment(awb) {
    const s = await this._getVerboseShipment(awb);
    const events = (s.Scans || []).map(sc => ({
      status: sc.ScanDetail?.Scan || sc.ScanDetail?.Instructions || 'Update',
      location: sc.ScanDetail?.ScannedLocation || '',
      description: sc.ScanDetail?.Instructions || '',
      timestamp: sc.ScanDetail?.ScanDateTime ? new Date(sc.ScanDetail.ScanDateTime) : new Date(),
    }));
    return {
      status: this._mapStatus(firstPresent(s?.Status?.Status, s?.Status, s?.status)),
      expectedDelivery: s.ExpectedDeliveryDate || null,
      events,
    };
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
    const map = { 'In Transit': 'InTransit', 'Delivered': 'Delivered', 'Pending Pickup': 'Booked', 'Picked Up': 'PickedUp', 'Out for Delivery': 'OutForDelivery', 'RTO': 'RTO', 'RTO Initiated': 'RTO' };
    return map[s] || s;
  }
}

// ─────────────────────────────────────────────────────────────
// DTDC PROVIDER
// ─────────────────────────────────────────────────────────────
class DTDCProvider extends ICourierProvider {
  get name()    { return 'DTDC'; }
  get enabled() {
    const dtdcTrackingSvc = require('../dtdc.service');
    return dtdcTrackingSvc.isConfigured();
  }
  get baseUrl() { return process.env.DTDC_API_URL || 'http://blktapi.dtdc.com'; }

  _headers() { return { 'APPKEY': process.env.DTDC_API_KEY, 'Content-Type': 'application/json' }; }

  async createShipment(payload) {
    if (!process.env.DTDC_CUSTOMER_CODE) {
      throw new Error('DTDC createShipment requires DTDC_CUSTOMER_CODE. Tracking can still work without it.');
    }
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

  async getShipmentDetails(awb) {
    const dtdcTrackingSvc = require('../dtdc.service');
    const tracking = await dtdcTrackingSvc.getTracking(awb);
    if (!tracking) throw new Error(`AWB ${awb} not found on DTDC`);
    const header = tracking.rawData?.trackHeader || {};
    return compactShipmentDetails({
      consignee: firstPresent(header?.strConsigneeName, tracking?.recipient),
      phone: firstPresent(header?.strMobileNo, header?.strConsigneeMobile),
      deliveryAddress: firstPresent(header?.strConsigneeAddress, header?.strAddress1, header?.strAddress2),
      destination: firstPresent(header?.strDestination, tracking?.destination),
      pincode: firstPresent(header?.strPincode, header?.strDestPincode),
      weight: normalizeWeightKg(firstPresent(header?.strWeight, header?.strActualWeight)),
      codAmount: numericValue(header?.strCodAmount, header?.strCollectableAmount),
      trackingStatus: firstPresent(tracking?.rawStatus, tracking?.statusDetail, tracking?.status),
      expectedDelivery: tracking?.expectedDate || null,
    });
  }

  async trackShipment(awb) {
    const dtdcTrackingSvc = require('../dtdc.service');
    const tracking = await dtdcTrackingSvc.getTracking(awb);
    if (!tracking) throw new Error(`AWB ${awb} not found on DTDC`);
    return {
      status: tracking.status || 'Unknown',
      expectedDelivery: tracking.expectedDate || null,
      events: (tracking.events || []).map(e => ({
        status: e.status || '',
        location: e.location || '',
        description: e.description || '',
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      })),
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

  async getShipmentDetails(awb) {
    const res = await fetch(`${this.baseUrl}/in/transportation/track/v1/getFlightDetails`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ Profile: this._profile(), WaybillNos: [awb], AWBType: 'awb', licKey: process.env.BLUEDART_LICENSE_KEY, noOfResults: 10 }),
    });
    if (!res.ok) throw new Error(`BlueDart tracking failed: ${res.status}`);
    const data = await res.json();
    const detail = data?.TrackingByFlightNoDtls?.[0] || {};
    const consignee = detail?.Consignee || detail?.consignee || {};
    return compactShipmentDetails({
      consignee: firstPresent(consignee.ConsigneeName, consignee.name, detail?.ConsigneeName),
      phone: firstPresent(consignee.ConsigneeMobile, consignee.phone, detail?.PhoneNo),
      deliveryAddress: firstPresent(consignee.ConsigneeAddress1, detail?.ConsigneeAddress1, detail?.Address),
      destination: firstPresent(consignee.ConsigneeAddress2, detail?.Destination, detail?.DestinationCity),
      pincode: firstPresent(consignee.ConsigneePincode, detail?.Pincode, detail?.DestinationPincode),
      weight: normalizeWeightKg(firstPresent(detail?.ActualWeight, detail?.ChargedWeight, detail?.Weight)),
      trackingStatus: firstPresent(detail?.Status, detail?.CurrentStatus),
    });
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

  async cancelShipment(_awb) { return { success: false, message: 'BlueDart cancellation requires manual intervention. Call 1860-233-1234.' }; }
  async getLabel(awb) { return { url: `${this.baseUrl}/in/transportation/waybill/v1/GenerateLabel?AWB=${awb}`, type: 'url' }; }

  async calculateRate({ originPin: _originPin, destPin, weight, cod }) {
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
  get enabled() {
    return !!(process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY)
      && !!(process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID)
      && !!process.env.TRACKON_PASSWORD;
  }
  get baseUrl() { return process.env.TRACKON_TRACKING_API_URL || process.env.TRACKON_API_URL || 'https://api.trackon.in'; }
  get bookingUrl() { return process.env.TRACKON_BOOKING_API_URL || 'http://trackon.in:5455'; }

  _auth() {
    return {
      appKey: process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY || '',
      userId: process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID || '',
      password: process.env.TRACKON_PASSWORD || '',
    };
  }

  async createShipment(payload) {
    const { awb, consignee, phone, deliveryAddress, deliveryCity, pincode, weight, pieces, serviceType, orderRef } = payload;
    const auth = this._auth();
    const res = await fetch(`${this.bookingUrl}/CrmApi/Crm/UploadPickupRequestWithoutDockNo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        Appkey: auth.appKey,
        userId: auth.userId,
        password: auth.password,
        SerialNo: String(Date.now()).slice(-6),
        RefNo: String(orderRef || awb || ''),
        ActionType: 'Book',
        CustomerCode: String(process.env.TRACKON_CUSTOMER_CODE || ''),
        ClientName: String(consignee || ''),
        AddressLine1: String(deliveryAddress || ''),
        AddressLine2: '',
        City: String(deliveryCity || ''),
        PinCode: String(pincode || ''),
        MobileNo: String(phone || '9999999999'),
        Email: String(payload.email || 'ops@seahawkcourier.com'),
        DocType: payload.isDox ? 'D' : 'N',
        TypeOfService: String(payload.typeOfService || payload.service || 'AIR').toUpperCase(),
        Weight: Number(weight || 0.5).toFixed(3),
        InvoiceValue: Number(payload.declaredValue || 0).toFixed(3),
        NoOfPieces: String(Number(pieces || 1)),
        ItemName: String(payload.productName || payload.contents || 'Shipment'),
        Remark: String(payload.notes || ''),
        PickupCustCode: String(process.env.TRACKON_PICKUP_CUST_CODE || ''),
        PickupCustName: String(process.env.TRACKON_PICKUP_CUST_NAME || process.env.TRACKON_PICKUP_NAME || 'Sea Hawk Courier & Cargo'),
        PickupAddr: String(process.env.TRACKON_PICKUP_ADDR || 'Shop 6 & 7, Rao Lal Singh Market'),
        PickupCity: String(process.env.TRACKON_PICKUP_CITY || 'Gurugram'),
        PickupState: String(process.env.TRACKON_PICKUP_STATE || 'Haryana'),
        PickupPincode: String(process.env.TRACKON_PICKUP_PINCODE || '122015'),
        PickupPhone: String(process.env.TRACKON_PICKUP_PHONE || '9911565523'),
        ServiceType: String(serviceType || 'Standard'),
      }),
    });
    if (!res.ok) throw new Error(`Trackon API error: ${res.status}`);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    const match = String(typeof data === 'string' ? data : JSON.stringify(data)).match(/\b\d{10,15}\b/);
    if (!match) throw new Error(typeof data === 'string' ? data : 'Trackon booking failed');
    return { awb: match[0], labelUrl: null, courier: 'Trackon' };
  }

  async getShipmentDetails(awb) {
    const auth = this._auth();
    const query = new URLSearchParams({
      AWBNo: String(awb || ''),
      AppKey: auth.appKey,
      userID: auth.userId,
      Password: auth.password,
    });
    const res = await fetch(`${this.baseUrl}/CrmApi/t1/AWBTrackingCustomer?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Trackon tracking failed: ${res.status}`);
    const data = await res.json();
    const summary = data?.CustomersummaryTrack || data?.summaryTrack || {};
    return compactShipmentDetails({
      consignee: firstPresent(summary.CONSIGNEE_NAME, summary.CLIENT_NAME, summary.CONSIGNEE),
      phone: firstPresent(summary.MOBILE_NO, summary.CONSIGNEE_MOBILE, summary.PHONE),
      deliveryAddress: firstPresent(summary.ADDRESS, summary.ADDRESS_LINE1),
      destination: firstPresent(summary.DESTINATION, summary.CITY, summary.CURRENT_CITY),
      pincode: firstPresent(summary.PINCODE, summary.PIN_CODE),
      weight: normalizeWeightKg(firstPresent(summary.WEIGHT, summary.ACTUAL_WEIGHT)),
      trackingStatus: firstPresent(summary.CURRENT_STATUS, summary.STATUS),
      expectedDelivery: firstPresent(summary.EDD, summary.EXPECTED_DELIVERY_DATE),
    });
  }

  async trackShipment(awb) {
    const auth = this._auth();
    const query = new URLSearchParams({
      AWBNo: String(awb || ''),
      AppKey: auth.appKey,
      userID: auth.userId,
      Password: auth.password,
    });
    const res = await fetch(`${this.baseUrl}/CrmApi/t1/AWBTrackingCustomer?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Trackon tracking failed: ${res.status}`);
    const data = await res.json();
    const summary = data?.CustomersummaryTrack || data?.summaryTrack || {};
    const scans = Array.isArray(data?.lstDetails) ? data.lstDetails : [];
    return {
      status: summary.CURRENT_STATUS || 'Unknown',
      events: scans.map(s => ({
        status: s.CURRENT_STATUS || '',
        location: s.CURRENT_CITY || '',
        description: s.TRACKING_CODE || '',
        timestamp: toTrackonDate(s.EVENTDATE, s.EVENTTIME),
      })),
    };
  }

  async cancelShipment(_awb) {
    return { success: false, message: 'Trackon cancellation API is not available in current integration docs.' };
  }

  async getLabel(awb) {
    return { url: `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${encodeURIComponent(awb)}`, type: 'url' };
  }

  async calculateRate({ originPin, destPin, weight, cod }) {
    // No rate endpoint in the provided Trackon API docs; use internal estimate.
    const w = parseFloat(weight) || 0.5;
    const c = Number(cod || 0) > 0 ? 40 : 0;
    return {
      total: Math.round((30 + Math.max(0, w - 0.5) * 22 + c) * 1.18),
      currency: 'INR',
      estimated: true,
      originPin,
      destPin,
    };
  }

  async checkServiceability(originPin, destPin) {
    // API docs shared do not define this endpoint; keep optimistic until Trackon publishes serviceability API.
    return { courier: 'Trackon', serviceable: true, originPin, destPin, estimated: true };
  }
}

function toTrackonDate(eventDate, eventTime) {
  const dateText = String(eventDate || '').trim();
  const timeText = String(eventTime || '00:00:00').trim();
  const m = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date();
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${timeText.length === 5 ? `${timeText}:00` : timeText}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// ─────────────────────────────────────────────────────────────
// PRIMTRACK (PRIMETRACK) PROVIDER
// PrimeTrack Courier — used via your channel partner account
// Env vars: PRIMTRACK_API_KEY, PRIMTRACK_CLIENT_ID, PRIMTRACK_API_URL
// ─────────────────────────────────────────────────────────────
class PrimtrackProvider extends ICourierProvider {
  get name()    { return 'Primtrack'; }
  get enabled() { return (!!process.env.PRIMTRACK_API_KEY && !!process.env.PRIMTRACK_CLIENT_ID) || hasTrackonCredentials(); }
  get baseUrl() { return process.env.PRIMTRACK_API_URL || 'https://api.primetrack.in'; }

  _headers() {
    return {
      'Authorization': `Bearer ${process.env.PRIMTRACK_API_KEY}`,
      'ClientId':      process.env.PRIMTRACK_CLIENT_ID,
      'Content-Type':  'application/json',
    };
  }

  _trackonFallback() {
    return new TrackonProvider();
  }

  async createShipment(payload) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      return this._trackonFallback().createShipment(payload);
    }
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

  async getShipmentDetails(awb) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      const details = await this._trackonFallback().getShipmentDetails(awb);
      return details ? { ...details } : details;
    }
    const res = await fetch(`${this.baseUrl}/v1/shipments/track/${awb}`, { headers: this._headers(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Primtrack tracking failed: ${res.status}`);
    const data = await res.json();
    const shipment = data?.data || {};
    const consignee = shipment?.consignee || {};
    return compactShipmentDetails({
      consignee: firstPresent(consignee.name, shipment?.consigneeName),
      phone: firstPresent(consignee.phone, shipment?.phone),
      deliveryAddress: firstPresent(consignee.address, shipment?.deliveryAddress),
      destination: firstPresent(consignee.city, shipment?.destination, shipment?.destinationCity),
      deliveryState: firstPresent(consignee.state, shipment?.destinationState),
      pincode: firstPresent(consignee.pincode, shipment?.pincode),
      weight: normalizeWeightKg(firstPresent(shipment?.weight, shipment?.package?.weight)),
      codAmount: numericValue(shipment?.codAmount, shipment?.package?.codAmount),
      trackingStatus: firstPresent(shipment?.currentStatus, shipment?.status),
    });
  }

  async trackShipment(awb) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      const tracking = await this._trackonFallback().trackShipment(awb);
      return tracking ? { ...tracking } : tracking;
    }
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
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      return this._trackonFallback().cancelShipment(awb);
    }
    const res = await fetch(`${this.baseUrl}/v1/shipments/cancel/${awb}`, { method: 'DELETE', headers: this._headers(), signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return { success: data.success, message: data.message };
  }

  async getLabel(awb) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      return this._trackonFallback().getLabel(awb);
    }
    return { url: `${this.baseUrl}/v1/shipments/label/${awb}`, type: 'url' };
  }

  async calculateRate({ originPin, destPin, weight, cod }) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      return this._trackonFallback().calculateRate({ originPin, destPin, weight, cod });
    }
    const res = await fetch(`${this.baseUrl}/v1/rates/calculate`, {
      method: 'POST', headers: this._headers(), signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ fromPincode: originPin, toPincode: destPin, weight: weight || 0.5, codAmount: cod || 0 }),
    });
    return res.json();
  }

  async checkServiceability(originPin, destPin) {
    if (!process.env.PRIMTRACK_API_KEY || !process.env.PRIMTRACK_CLIENT_ID) {
      return this._trackonFallback().checkServiceability(originPin, destPin);
    }
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
