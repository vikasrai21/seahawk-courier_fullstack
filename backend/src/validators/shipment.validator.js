const { z } = require('zod');

const STATUSES = ['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'];
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Helper: coerce null/undefined to empty string
const optStr = z.union([z.string(), z.null(), z.undefined()]).transform(v => v ?? '');

const shipmentSchema = z.object({
  date:        z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  clientCode:  z.string().min(1, 'Client code is required').transform(v => v.toUpperCase()),
  awb:         z.string().min(1, 'AWB is required').trim(),
  consignee:   optStr.default(''),
  destination: optStr.default(''),
  weight:      z.coerce.number().min(0).default(0),
  amount:      z.coerce.number().min(0).default(0),
  courier:     optStr.default(''),
  department:  optStr.default(''),
  service:     optStr.default('Standard'),
  status:      optStr.default('Booked'),
  remarks:     optStr.default(''),
});

const updateShipmentSchema = shipmentSchema.partial();
const statusUpdateSchema   = z.object({ status: z.enum(STATUSES) });
const scanAwbSchema        = z.object({ awb: z.string().min(1, 'AWB is required').trim(), courier: z.enum(['Delhivery','Trackon','DTDC']).default('Delhivery') });

const importSchema = z.object({
  shipments: z.array(z.object({
    date:        z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => v ? String(v) : '').default(''),
    clientCode:  z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || 'MISC').trim().toUpperCase()).default('MISC'),
    awb:         z.union([z.string(), z.number()]).transform(v => String(v).trim()),
    consignee:   z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || '')).default(''),
    destination: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || '')).default(''),
    weight:      z.coerce.number().optional().default(0),
    amount:      z.coerce.number().optional().default(0),
    courier:     z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || '')).default(''),
    department:  z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || '')).default(''),
    service:     optStr.default('Standard'),
    status:      optStr.default('Delivered'),
    remarks:     z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || '')).default(''),
  })).min(1, 'No shipments provided'),
});

// Fix: Accept null values from DB on edit
const clientSchema = z.object({
  code:      z.string().min(1, 'Client code required').transform(v => v.toUpperCase()),
  company:   z.string().min(1, 'Company name required'),
  contact:   optStr.default(''),
  phone:     optStr.default(''),
  whatsapp:  optStr.default(''),
  email:     z.union([z.string().email('Invalid email'), z.literal(''), z.null(), z.undefined()]).transform(v => v ?? '').default(''),
  gst:       optStr.default(''),
  address:   optStr.default(''),
  notes:     optStr.default(''),
  active:    z.boolean().optional().default(true),
});

const contractSchema = z.object({
  clientCode:   z.string().min(1).transform(v => v.toUpperCase()),
  name:         z.string().min(1, 'Contract name required'),
  courier:      optStr.optional(),
  service:      optStr.optional(),
  pricingType:  z.enum(['PER_KG','FLAT','PER_SHIPMENT']).default('PER_KG'),
  baseRate:     z.coerce.number().min(0).default(0),
  minCharge:    z.coerce.number().min(0).default(0),
  fuelSurcharge:z.coerce.number().min(0).default(0),
  gstPercent:   z.coerce.number().min(0).default(18),
  validFrom:    optStr.optional(),
  validTo:      optStr.optional(),
  active:       z.boolean().optional().default(true),
  notes:        optStr.optional(),
});

const invoiceSchema = z.object({
  clientCode: z.string().min(1).transform(v => v.toUpperCase()),
  fromDate:   z.string().regex(dateRegex),
  toDate:     z.string().regex(dateRegex),
  gstPercent: z.coerce.number().default(18),
  notes:      optStr.optional(),
});

module.exports = { shipmentSchema, updateShipmentSchema, statusUpdateSchema, scanAwbSchema, importSchema, clientSchema, contractSchema, invoiceSchema };
