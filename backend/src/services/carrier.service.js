/* ============================================================
   carrier.service.js — Feature #1: Courier API Integration
   
   Supports: Delhivery, DTDC, Trackon, BlueDart (live APIs)
   FedEx, DHL (stub — require paid API keys)
   
   Each carrier implements: createShipment, fetchTracking, cancelShipment
   ============================================================ */

'use strict';

const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const cache   = require('../utils/cache');
const { fetchJsonWithRetry, fetchWithRetry } = require('../utils/httpRetry');

/* ════════════════════════════════════════════════════════════
   CARRIER CONFIG LOADER
   ════════════════════════════════════════════════════════════ */
function getCarrierConfig(carrier) {
  // Config loaded from environment variables — no DB model needed
  const configs = {
    Delhivery: {
      carrier:     'Delhivery',
      enabled:     !!process.env.DELHIVERY_API_KEY,
      apiKey:      process.env.DELHIVERY_API_KEY,
      apiUrl:      process.env.DELHIVERY_API_URL || 'https://track.delhivery.com',
      warehouseId: process.env.DELHIVERY_WAREHOUSE || 'Primary',
      config:      {
        sellerName:    'Sea Hawk Courier & Cargo',
        sellerAddress: 'Shop 6 & 7, Rao Lal Singh Market',
        sellerCity:    'Gurugram',
        sellerState:   'Haryana',
        sellerPin:     '122015',
      },
    },
    DTDC: {
      carrier:   'DTDC',
      enabled:   !!process.env.DTDC_CUSTOMER_CODE,
      apiKey:    process.env.DTDC_API_KEY,
      apiUrl:    process.env.DTDC_API_URL || 'http://blktapi.dtdc.com',
      config:    { customerCode: process.env.DTDC_CUSTOMER_CODE },
    },
    Trackon: {
      carrier:   'Trackon',
      enabled:   !!(process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY)
              && !!(process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID)
              && !!process.env.TRACKON_PASSWORD,
      apiKey:    process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY,
      apiUrl:    process.env.TRACKON_TRACKING_API_URL || process.env.TRACKON_API_URL || 'https://api.trackon.in',
      config:    {
        appKey: process.env.TRACKON_APP_KEY || process.env.TRACKON_API_KEY || '',
        userId: process.env.TRACKON_USER_ID || process.env.TRACKON_CUSTOMER_ID || process.env.TRACKON_CLIENT_ID || '',
        password: process.env.TRACKON_PASSWORD || '',
        bookingUrl: process.env.TRACKON_BOOKING_API_URL || 'http://trackon.in:5455',
        customerCode: process.env.TRACKON_CUSTOMER_CODE || '',
        pickupCustCode: process.env.TRACKON_PICKUP_CUST_CODE || '',
        pickupCustName: process.env.TRACKON_PICKUP_CUST_NAME || process.env.TRACKON_PICKUP_NAME || 'Sea Hawk Courier & Cargo',
        pickupAddr: process.env.TRACKON_PICKUP_ADDR || 'Shop 6 & 7, Rao Lal Singh Market',
        pickupCity: process.env.TRACKON_PICKUP_CITY || 'Gurugram',
        pickupState: process.env.TRACKON_PICKUP_STATE || 'Haryana',
        pickupPincode: process.env.TRACKON_PICKUP_PINCODE || '122015',
        pickupPhone: process.env.TRACKON_PICKUP_PHONE || '9911565523',
      },
    },
    BlueDart: {
      carrier:   'BlueDart',
      enabled:   !!process.env.BLUEDART_LICENSE_KEY,
      apiKey:    process.env.BLUEDART_LICENSE_KEY,
      apiUrl:    process.env.BLUEDART_API_URL || 'https://apigateway.bluedart.com',
      config:    {
        loginId: process.env.BLUEDART_LOGIN_ID,
        areaCode: process.env.BLUEDART_AREA_CODE || 'Del',
      },
    },
  };
  const cfg = configs[carrier];
  if (!cfg) throw new Error(`Carrier ${carrier} is not supported`);
  if (!cfg.enabled) throw new Error(`Carrier ${carrier} API key not configured. Set env variables.`);
  return cfg;
}

/* ════════════════════════════════════════════════════════════
   DELHIVERY
   Official API: https://developers.delhivery.com
   Required env: DELHIVERY_API_KEY, DELHIVERY_WAREHOUSE
   ════════════════════════════════════════════════════════════ */
const delhivery = {

  async createShipment(data, cfg) {
    const payload = {
      format:          'json',
      data: JSON.stringify({
        shipments: [{
          name:        data.consignee,
          add:         data.deliveryAddress,
          city:        data.deliveryCity,
          state:       data.deliveryState,
          country:     data.deliveryCountry || 'India',
          pin:         data.pin,
          phone:       data.phone || '9999999999',
          order:       data.orderRef || data.awb,
          payment_mode: 'Pre-paid',
          cod_amount:  '0',
          weight:      (data.weightGrams / 1000).toFixed(3),
          shipment_length: data.length || 10,
          shipment_width:  data.width  || 10,
          shipment_height: data.height || 10,
          seller_name:     cfg.config?.sellerName || 'Sea Hawk Courier',
          seller_add:      cfg.config?.sellerAddress || 'Gurugram, Haryana',
          seller_city:     cfg.config?.sellerCity || 'Gurugram',
          seller_state:    cfg.config?.sellerState || 'Haryana',
          seller_pin:      cfg.config?.sellerPin || '122015',
          seller_cust_id:  cfg.config?.customerId || '',
          products_desc:   data.contents || 'Goods',
          hsn_code:        '',
          cod_charges:     '0',
          gift_wrap:       false,
          invoice_value:   String(data.declaredValue || 0),
          waybill:         '', // auto-generated by Delhivery
        }],
        pickup_location: { name: cfg.warehouseId || 'Primary' },
      }),
    };

    const res = await _post(
      `${cfg.apiUrl}/api/cmu/create.json`,
      payload,
      { 'Authorization': `Token ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      'form'
    );

    if (!res.packages?.[0]?.waybill) {
      throw new Error(res.packages?.[0]?.remarks || 'Delhivery AWB generation failed');
    }

    return {
      awb:      res.packages[0].waybill,
      carrier:  'Delhivery',
      trackUrl: `https://www.delhivery.com/track/package/${res.packages[0].waybill}`,
      raw:      res,
    };
  },

  async fetchTracking(awb, cfg) {
    const res = await _get(
      `${cfg.apiUrl}/api/v1/packages/json/?waybill=${awb}`,
      { 'Authorization': `Token ${cfg.apiKey}` }
    );

    const s = res?.ShipmentData?.[0]?.Shipment;
    if (!s) return null;

    const events = (s.Scans || []).map(scan => ({
      status:      mapDelhiveryStatus(scan.ScanDetail?.Scan || ''),
      location:    scan.ScanDetail?.ScannedLocation || '',
      description: scan.ScanDetail?.Instructions || scan.ScanDetail?.Scan || '',
      timestamp:   scan.ScanDetail?.ScanDateTime
                   ? new Date(scan.ScanDetail.ScanDateTime)
                   : new Date(),
      source:      'CARRIER_API',
      rawData:     scan,
    }));

    return {
      status:       mapDelhiveryStatus(s.Status?.Status || ''),
      statusText:   s.Status?.Instructions || s.Status?.Status,
      origin:       s.Origin,
      destination:  s.Destination,
      expectedDate: s.ExpectedDeliveryDate,
      events,
    };
  },

  async cancelShipment(awb, cfg) {
    const res = await _post(
      `${cfg.apiUrl}/api/p/edit`,
      { waybill: awb, cancellation: true },
      { 'Authorization': `Token ${cfg.apiKey}`, 'Content-Type': 'application/json' }
    );
    return res;
  },
};

/* ════════════════════════════════════════════════════════════
   DTDC
   Official API: https://dtdc.com/partner-api/
   Required: DTDC API credentials (partner login)
   ════════════════════════════════════════════════════════════ */
const dtdc = {

  async createShipment(data, cfg) {
    const payload = {
      api_type:    'json',
      request_id:  Date.now().toString(),
      access_token: cfg.apiKey,
      json_input: JSON.stringify([{
        CUST_CODE:     cfg.accountNo,
        ORIGIN_AREA:   'DL',
        CONSIGNEE:     data.consignee,
        DEST_CITY:     data.deliveryCity,
        PINCODE:       data.pin,
        COD_AMOUNT:    '0',
        COMMODITY_VAL: String(data.declaredValue || 0),
        WEIGHT:        String((data.weightGrams / 1000).toFixed(2)),
        ADD1:          data.deliveryAddress?.slice(0, 50) || '',
        ADD2:          data.deliveryAddress?.slice(50, 100) || '',
        TEL_NO:        data.phone || '9999999999',
      }]),
    };

    const res = await _post(
      `${cfg.apiUrl}/secure/shiprequest`,
      payload,
      { 'Content-Type': 'application/json' }
    );

    const pkg = Array.isArray(res) ? res[0] : res;
    if (!pkg?.AWB_NO) throw new Error(pkg?.REASON || 'DTDC AWB generation failed');

    return {
      awb:      pkg.AWB_NO,
      carrier:  'DTDC',
      trackUrl: `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${pkg.AWB_NO}`,
      raw:      res,
    };
  },

  async fetchTracking(awb, cfg) {
    const res = await _post(
      `${cfg.apiUrl}/secure/gettracking`,
      { awb_no: awb, access_token: cfg.apiKey },
      { 'Content-Type': 'application/json' }
    );

    if (!res?.shipment_track_activities) return null;

    const events = res.shipment_track_activities.map(e => ({
      status:      mapDTDCStatus(e.act_type || ''),
      location:    e.origin || '',
      description: e.activity || '',
      timestamp:   e.act_time ? new Date(e.act_time) : new Date(),
      source:      'CARRIER_API',
      rawData:     e,
    }));

    return { status: events[0]?.status || 'InTransit', events };
  },

  async cancelShipment(awb, cfg) {
    return await _post(
      `${cfg.apiUrl}/secure/cancelbooking`,
      { awb_no: awb, access_token: cfg.apiKey },
      { 'Content-Type': 'application/json' }
    );
  },
};

/* ════════════════════════════════════════════════════════════
   TRACKON
   Required: TRACKON_API_KEY (+ TRACKON_CUSTOMER_ID when provided)
   ════════════════════════════════════════════════════════════ */
const trackon = {

  async createShipment(data, cfg) {
    const serialNo = String(data.serialNo || Date.now()).slice(-6);
    const address = String(data.deliveryAddress || data.destination || '').trim();
    const [addressLine1, ...addressRest] = address.split(',').map(s => s.trim()).filter(Boolean);
    const serviceType = getTrackonServiceType(data);
    const typeOfService = String(data.typeOfService || data.service || 'AIR').toUpperCase();
    const payload = {
      Appkey: cfg.config?.appKey,
      userId: cfg.config?.userId,
      password: cfg.config?.password,
      SerialNo: serialNo,
      RefNo: String(data.orderRef || data.awb || ''),
      ActionType: String(data.actionType || 'Book'),
      CustomerCode: String(data.clientCode || cfg.config?.customerCode || ''),
      ClientName: String(data.consignee || ''),
      AddressLine1: String(addressLine1 || address || ''),
      AddressLine2: String(addressRest.join(', ') || data.deliveryState || ''),
      City: String(data.deliveryCity || data.destinationCity || ''),
      PinCode: String(data.pin || data.deliveryPin || ''),
      MobileNo: String(data.phone || data.mobile || '9999999999'),
      Email: String(data.email || 'ops@seahawkcourier.com'),
      DocType: String(data.docType || (data.isDox ? 'D' : 'N')).toUpperCase() === 'D' ? 'D' : 'N',
      TypeOfService: typeOfService,
      Weight: Number((Number(data.weightGrams || 0) / 1000).toFixed(3)) || Number(data.weight || 0.5),
      InvoiceValue: Number(data.declaredValue || 0).toFixed(3),
      NoOfPieces: String(Number(data.pieces || 1)),
      ItemName: String(data.contents || data.itemName || 'Shipment'),
      Remark: String(data.notes || ''),
      PickupCustCode: String(data.pickupCustCode || cfg.config?.pickupCustCode || ''),
      PickupCustName: String(data.pickupName || cfg.config?.pickupCustName || ''),
      PickupAddr: String(data.pickupAddress || cfg.config?.pickupAddr || ''),
      PickupCity: String(data.pickupCity || cfg.config?.pickupCity || ''),
      PickupState: String(data.pickupState || cfg.config?.pickupState || ''),
      PickupPincode: String(data.pickupPincode || cfg.config?.pickupPincode || ''),
      PickupPhone: String(data.pickupPhone || cfg.config?.pickupPhone || ''),
      ServiceType: serviceType,
    };

    const res = await _postJsonOrText(
      `${cfg.config?.bookingUrl}/CrmApi/Crm/UploadPickupRequestWithoutDockNo`,
      payload,
      { 'Content-Type': 'application/json; charset=utf-8' }
    );

    const awb = extractTrackonAwb(res);
    if (!awb) {
      const errText = typeof res === 'string' ? res : JSON.stringify(res || {});
      throw new Error(`Trackon booking failed: ${errText.slice(0, 200)}`);
    }

    return {
      awb,
      carrier: 'Trackon',
      trackUrl: `http://trackon.in/Trackon/pub/mainHtml.pub?awbs=${encodeURIComponent(awb)}`,
      labelUrl: null,
      raw: res,
    };
  },

  async fetchTracking(awb, cfg) {
    const query = new URLSearchParams({
      AWBNo: String(awb || ''),
      AppKey: cfg.config?.appKey || '',
      userID: cfg.config?.userId || '',
      Password: cfg.config?.password || '',
    });
    const res = await _get(
      `${cfg.apiUrl}/CrmApi/t1/AWBTrackingCustomer?${query.toString()}`,
      { 'Content-Type': 'application/json; charset=utf-8' }
    );

    const summary = res?.summaryTrack || {};
    const scans = Array.isArray(res?.lstDetails) ? res.lstDetails : [];
    const events = scans.map((e) => ({
      status: mapTrackonStatus(`${e.TRACKING_CODE || ''} ${e.CURRENT_STATUS || ''}`),
      location: e.CURRENT_CITY || '',
      description: e.CURRENT_STATUS || '',
      timestamp: parseTrackonTimestamp(e.EVENTDATE, e.EVENTTIME),
      source: 'CARRIER_API',
      rawData: e,
    }));

    if (events.length === 0 && (summary.CURRENT_STATUS || summary.TRACKING_CODE)) {
      events.push({
        status: mapTrackonStatus(`${summary.TRACKING_CODE || ''} ${summary.CURRENT_STATUS || ''}`),
        location: summary.CURRENT_CITY || '',
        description: summary.CURRENT_STATUS || '',
        timestamp: parseTrackonTimestamp(summary.EVENTDATE, summary.EVENTTIME),
        source: 'CARRIER_API',
        rawData: summary,
      });
    }

    const latestRaw = summary.CURRENT_STATUS || scans?.[0]?.CURRENT_STATUS || '';
    const latestCode = summary.TRACKING_CODE || scans?.[0]?.TRACKING_CODE || '';
    return {
      status: events[0]?.status || mapTrackonStatus(`${latestCode} ${latestRaw}`) || 'InTransit',
      statusText: latestRaw || '',
      origin: summary.ORIGIN || null,
      destination: summary.DESTINATION || null,
      events,
    };
  },

  async cancelShipment(awb, cfg) {
    // Trackon booking API v2.02 docs shared for this project do not define cancellation API.
    throw new Error(`Trackon cancellation API is not available in current credentials/doc set for AWB ${awb}`);
  },
};

/* ════════════════════════════════════════════════════════════
   BLUEDART
   Official API: https://www.bluedart.com/web/guest/api
   Required: BlueDart API license key
   ════════════════════════════════════════════════════════════ */
const bluedart = {

  async createShipment(data, cfg) {
    const payload = {
      Profile: {
        Api_type: 'S',
        LicenceKey: cfg.apiKey,
        LoginID:    cfg.config?.loginId || '',
      },
      Consignee: {
        ConsigneeAddress1: data.deliveryAddress?.slice(0, 50) || '',
        ConsigneeAddress2: data.deliveryAddress?.slice(50) || '',
        ConsigneeAttention: data.consignee,
        ConsigneeCity:      data.deliveryCity,
        ConsigneeMobile:    data.phone || '9999999999',
        ConsigneeName:      data.consignee,
        ConsigneePincode:   data.pin,
        ConsigneeState:     data.deliveryState || '',
      },
      Shipment: {
        ActualWeight:    (data.weightGrams / 1000).toFixed(2),
        CollectableAmount: '0',
        CreditReferenceNo: data.orderRef || '',
        DeclaredValue:   String(data.declaredValue || 0),
        Dimensions: [{
          Breadth: data.width  || 10,
          Height:  data.height || 10,
          Length:  data.length || 10,
          Count:   1,
        }],
        IsDox: data.isDox ? 'Y' : 'N',
        ItemCount: data.pieces || 1,
        PickupDate: `/Date(${Date.now()})/`,
        PickupTime: '1100',
        ProductCode: data.productCode || 'A',
        SpecialInstruction: data.notes || '',
        SubProductCode: '',
      },
      Shipper: {
        OriginArea:   cfg.config?.originArea || 'DEL',
        Shipper:      cfg.config?.shipperCode || '',
        ShipperAddress1: cfg.config?.shipperAddress || 'Gurugram, Haryana',
        ShipperCity:  cfg.config?.shipperCity || 'Gurugram',
        ShipperName:  'Sea Hawk Courier',
        ShipperPincode: cfg.config?.shipperPin || '122015',
      },
    };

    const res = await _post(
      `${cfg.apiUrl}/ShipmentAPI/ShipmentCreation`,
      payload,
      { 'Content-Type': 'application/json' }
    );

    const result = res?.ShipmentCreationResult;
    if (!result?.AWBNo) throw new Error(result?.ErrorMessage || 'BlueDart AWB generation failed');

    return {
      awb:      result.AWBNo,
      carrier:  'BlueDart',
      trackUrl: `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${result.AWBNo}`,
      raw:      res,
    };
  },

  async fetchTracking(awb, cfg) {
    const res = await _post(
      `${cfg.apiUrl}/TrackingAPI/WaybillTrack`,
      {
        Profile:  { Api_type: 'S', LicenceKey: cfg.apiKey, LoginID: cfg.config?.loginId || '' },
        AWBNo:    awb,
        TrackFor: 0,
      },
      { 'Content-Type': 'application/json' }
    );

    const scans = res?.TrackDetails?.[0]?.TrackNthPacket?.[0]?.TrackPacketSummary;
    if (!scans) return null;

    const events = scans.map(s => ({
      status:      mapBluedartStatus(s.StatusType || ''),
      location:    s.Scanlocation || '',
      description: s.StatusDescription || '',
      timestamp:   s.ScanDate ? new Date(`${s.ScanDate} ${s.ScanTime || ''}`) : new Date(),
      source:      'CARRIER_API',
      rawData:     s,
    }));

    return { status: events[0]?.status || 'InTransit', events };
  },

  async cancelShipment() {
    throw new Error('BlueDart cancellation requires manual process. Contact BlueDart support.');
  },
};

/* ════════════════════════════════════════════════════════════
   FEDEX — Stub (requires FedEx developer account + OAuth2)
   ════════════════════════════════════════════════════════════ */
const fedex = {
  async createShipment() {
    throw new Error('FedEx API integration requires FedEx developer account. See CARRIER-SETUP.md');
  },
  async fetchTracking(awb) {
    // FedEx tracking URLs work without auth for public tracking
    return {
      status:  'Unknown',
      events:  [],
      trackUrl: `https://www.fedex.com/fedextrack/?trknbr=${awb}`,
      message: 'Live FedEx tracking requires FedEx API credentials',
    };
  },
  async cancelShipment() {
    throw new Error('FedEx API integration requires FedEx developer account');
  },
};

/* ════════════════════════════════════════════════════════════
   DHL — Stub (requires DHL Express API credentials)
   ════════════════════════════════════════════════════════════ */
const dhl = {
  async createShipment() {
    throw new Error('DHL API requires DHL Express account. Contact DHL India for API access.');
  },
  async fetchTracking(awb, cfg) {
    if (!cfg?.apiKey) return {
      status:  'Unknown',
      events:  [],
      trackUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${awb}`,
      message: 'DHL API credentials not configured',
    };
    const res = await _get(
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${awb}`,
      { 'DHL-API-Key': cfg.apiKey }
    );
    const events = (res?.shipments?.[0]?.events || []).map(e => ({
      status:      mapDHLStatus(e.typeCode || ''),
      location:    e.location?.address?.addressLocality || '',
      description: e.description || '',
      timestamp:   e.timestamp ? new Date(e.timestamp) : new Date(),
      source:      'CARRIER_API',
      rawData:     e,
    }));
    return { status: events[0]?.status || 'InTransit', events };
  },
  async cancelShipment() {
    throw new Error('DHL shipment cancellation not available via API');
  },
};

/* ════════════════════════════════════════════════════════════
   CARRIER ROUTER
   ════════════════════════════════════════════════════════════ */
const CARRIERS = { Delhivery: delhivery, DTDC: dtdc, Trackon: trackon, BlueDart: bluedart, FedEx: fedex, DHL: dhl };

async function createShipment(carrier, data) {
  const impl = CARRIERS[carrier];
  if (!impl) throw new Error(`Unknown carrier: ${carrier}`);
  const cfg = await getCarrierConfig(carrier);
  logger.info(`Creating shipment via ${carrier} API`, { consignee: data.consignee, pin: data.pin });
  return impl.createShipment(data, cfg);
}

async function fetchTracking(carrier, awb, options = {}) {
  const impl = CARRIERS[carrier];
  if (!impl) throw new Error(`Unknown carrier: ${carrier}`);
  try {
    const upperAwb = String(awb || '').toUpperCase();
    const useCache = !options.bypassCache;
    const cacheKey = `carrier:track:${carrier}:${upperAwb}`;

    if (useCache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    let cfg;
    try {
      cfg = getCarrierConfig(carrier);
    } catch (err) {
      cfg = { apiUrl: '', apiKey: '', enabled: true, config: {} };
    }
    const tracking = await impl.fetchTracking(awb, cfg);
    if (tracking && useCache) {
      await cache.set(cacheKey, tracking, 300); // 5 minutes
    }
    return tracking;
  } catch (err) {
    logger.warn(`Tracking fetch failed for ${carrier}/${awb}: ${err.message}`);
    return null;
  }
}

async function cancelShipment(carrier, awb) {
  const impl = CARRIERS[carrier];
  if (!impl) throw new Error(`Unknown carrier: ${carrier}`);
  const cfg = await getCarrierConfig(carrier);
  return impl.cancelShipment(awb, cfg);
}

/* ── Persist tracking events to DB ── */
async function syncTrackingEvents(shipmentId, awb, carrier) {
  const tracking = await fetchTracking(carrier, awb, { bypassCache: true });
  if (!tracking?.events?.length) return 0;

  // Get existing events to avoid duplicates
  const existing = await prisma.trackingEvent.findMany({
    where: { shipmentId },
    select: { status: true, timestamp: true },
  });
  const existingSet = new Set(existing.map(e => `${e.status}_${e.timestamp.toISOString()}`));

  const toInsert = tracking.events.filter(e => {
    const key = `${e.status}_${e.timestamp.toISOString()}`;
    return !existingSet.has(key);
  });

  if (toInsert.length === 0) return 0;

  await prisma.trackingEvent.createMany({
    data: toInsert.map(e => ({
      shipmentId,
      awb,
      status:      e.status,
      location:    e.location,
      description: e.description,
      timestamp:   e.timestamp,
      source:      'CARRIER_API',
      rawData:     e.rawData,
    })),
    skipDuplicates: true,
  });

  // Update shipment status with latest
  if (tracking.status) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data:  { status: tracking.status },
    });
  }

  logger.info(`Synced ${toInsert.length} tracking events for AWB ${awb}`);
  return toInsert.length;
}

/* ════════════════════════════════════════════════════════════
   STATUS MAPPERS
   ════════════════════════════════════════════════════════════ */
function mapDelhiveryStatus(raw) {
  const s = raw.toUpperCase();
  if (s.includes('DELIVER') && !s.includes('OUT')) return 'Delivered';
  if (s.includes('OFD') || s.includes('OUT FOR')) return 'OutForDelivery';
  if (s.includes('TRANSIT') || s.includes('DISPATCH') || s.includes('REACHED')) return 'InTransit';
  if (s.includes('PICK') || s.includes('MANIFEST')) return 'PickedUp';
  if (s.includes('RTO') || s.includes('RETURN')) return 'RTO';
  if (s.includes('FAIL') || s.includes('UNDELIVER')) return 'Failed';
  return 'Booked';
}
function mapDTDCStatus(raw) {
  const s = raw.toUpperCase();
  if (s.includes('DELIVER')) return 'Delivered';
  if (s.includes('OUT FOR')) return 'OutForDelivery';
  if (s.includes('TRANSIT') || s.includes('DISPATCH')) return 'InTransit';
  if (s.includes('PICK') || s.includes('COLLECT')) return 'PickedUp';
  if (s.includes('RTO')) return 'RTO';
  return 'InTransit';
}
function mapTrackonStatus(raw) {
  const s = String(raw || '').toUpperCase().trim();
  if (s.startsWith('DDU') || s.includes('DDUB') || s.includes('DDUF') || s.includes('DDUA')) return 'Delivered';
  if (s.startsWith('DRS') || s.includes('OUT FOR DELIVERY')) return 'OutForDelivery';
  if (s.startsWith('DNU') || s.includes('UNDELIVER') || s.includes('ATMP')) return 'Failed';
  if (s.startsWith('RTO') || s.startsWith('RSET') || s.startsWith('RMFT') || s.startsWith('RHOD') || s.startsWith('RHON') || s.startsWith('RHO') || s.startsWith('RIS')) return 'RTO';
  if (s.startsWith('BOK') || s.includes('BOOKED') || s.includes('PICK UP')) return 'Booked';
  if (s.includes('OUT FOR') || s.includes('OFD')) return 'OutForDelivery';
  if (s.includes('DELIVER')) return 'Delivered';
  if (s.includes('TRANSIT') || s.includes('INSCAN') || s.includes('DISPATCH')) return 'InTransit';
  if (s.includes('BOOK') || s.includes('PICK')) return 'Booked';
  if (s.includes('RTO') || s.includes('RETURN')) return 'RTO';
  if (s.includes('FAIL') || s.includes('UNDELIVER')) return 'Failed';
  return 'InTransit';
}
function mapBluedartStatus(raw) {
  const s = raw.toUpperCase();
  if (s === 'DL' || s.includes('DELIVER')) return 'Delivered';
  if (s === 'OFD' || s.includes('OUT')) return 'OutForDelivery';
  if (s.includes('TRANSIT') || s.includes('DISPATCH')) return 'InTransit';
  if (s.includes('PICK')) return 'PickedUp';
  if (s.includes('RTO')) return 'RTO';
  return 'InTransit';
}
function mapDHLStatus(raw) {
  const codes = { 'OK': 'Delivered', 'OFD': 'OutForDelivery', 'IT': 'InTransit', 'PU': 'PickedUp' };
  return codes[raw.toUpperCase()] || 'InTransit';
}

/* ════════════════════════════════════════════════════════════
   HTTP HELPERS
   ════════════════════════════════════════════════════════════ */
async function _get(url, headers = {}) {
  return fetchJsonWithRetry(url, { headers }, { attempts: 3, timeoutMs: 10000 });
}

async function _post(url, body, headers = {}, bodyType = 'json') {
  let reqBody, contentType;
  if (bodyType === 'form') {
    reqBody = Object.entries(body).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    contentType = 'application/x-www-form-urlencoded';
  } else {
    reqBody = JSON.stringify(body);
    contentType = 'application/json';
  }
  return fetchJsonWithRetry(url, {
    method:  'POST',
    headers: { 'Content-Type': contentType, ...headers },
    body:    reqBody,
  }, { attempts: 3, timeoutMs: 12000 });
}

async function _postJsonOrText(url, body, headers = {}, bodyType = 'json') {
  let reqBody, contentType;
  if (bodyType === 'form') {
    reqBody = Object.entries(body).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    contentType = 'application/x-www-form-urlencoded';
  } else {
    reqBody = JSON.stringify(body);
    contentType = 'application/json';
  }

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': contentType, ...headers },
    body: reqBody,
  }, { attempts: 3, timeoutMs: 12000 });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractTrackonAwb(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const match = raw.match(/\b\d{10,15}\b/);
    return match ? match[0] : null;
  }

  const candidateKeys = ['docketNo', 'DocketNo', 'awb', 'AWB', 'Docket No', 'DocketNo.'];
  for (const key of candidateKeys) {
    const val = raw[key];
    if (val && /\d{10,15}/.test(String(val))) {
      const m = String(val).match(/\d{10,15}/);
      if (m) return m[0];
    }
  }

  const match = JSON.stringify(raw).match(/\b\d{10,15}\b/);
  return match ? match[0] : null;
}

function parseTrackonTimestamp(eventDate, eventTime) {
  const dateText = String(eventDate || '').trim();
  const timeText = String(eventTime || '00:00:00').trim();
  if (!dateText) return new Date();

  const m = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return new Date();

  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${timeText.length === 5 ? `${timeText}:00` : timeText}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function getTrackonServiceType(data = {}) {
  const fromInput = String(data.serviceType || '').trim();
  if (fromInput) return fromInput;

  const awb = String(data.awb || '');
  if (awb.startsWith('50')) return 'Parcel';
  if (awb.startsWith('10')) return 'Standard';
  if (awb.startsWith('20')) return 'Prime';
  if (awb.startsWith('80')) return 'Roadx';
  if (awb.startsWith('60')) return 'Tecex';
  if (awb.startsWith('62')) return 'Vtexp';
  if (awb.startsWith('40')) return 'Smexp';
  return 'Standard';
}

module.exports = {
  createShipment,
  fetchTracking,
  cancelShipment,
  syncTrackingEvents,
  CARRIERS: Object.keys(CARRIERS),
};
