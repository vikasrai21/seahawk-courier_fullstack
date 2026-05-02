const { z } = require('zod');

const STATUSES = ['Booked','PickedUp','InTransit','OutForDelivery','Delivered','Failed','NDR','Delayed','RTO','RTODelivered','Cancelled'];
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Helper: coerce null/undefined to empty string
const optStr = z.union([z.string(), z.null(), z.undefined()]).transform(v => v ?? '');

const shipmentSchema = z.object({
  date:        z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  clientCode:  z.string().min(1, 'Client code is required').transform(v => v.toUpperCase()),
  awb:         z.string().min(1, 'AWB is required').trim(),
  consignee:   optStr.default(''),
  destination: optStr.default(''),
  weight:      z.coerce.number().positive().max(1000, 'Weight must be in kg and cannot exceed 1000kg'),
  amount:      z.coerce.number().min(0).default(0),
  courier:     optStr.default(''),
  department:  optStr.default(''),
  service:     optStr.default('Standard'),
  status:      optStr.default('Booked'),
  remarks:     optStr.default(''),
});

const updateShipmentSchema = shipmentSchema.partial();
const statusUpdateSchema   = z.object({
  status: z.enum(STATUSES),
  note: optStr.optional(),
});
const sessionContextSchema = z.object({
  sessionDate: z.string().regex(dateRegex).optional(),
  dominantClient: z.string().trim().min(1).optional(),
  dominantClientCount: z.coerce.number().int().min(0).optional(),
}).passthrough();
const scanAwbSchema        = z.object({
  awb: z.string().min(1, 'AWB is required').trim(),
  courier: z.enum(['Delhivery','Trackon','DTDC','AUTO']).default('AUTO'),
  captureOnly: z.coerce.boolean().optional().default(false),
  imageBase64: z.string().optional(),
  focusImageBase64: z.string().optional(),
  sessionContext: sessionContextSchema.optional(),
});
const scanImageSchema = z.object({
  imageBase64: z.string().trim().min(1, 'imageBase64 is required'),
  sessionContext: sessionContextSchema.optional(),
});
const scanMobileSchema = z.object({
  awb: z.string().trim().optional().default(''),
  imageBase64: z.string().trim().optional(),
  focusImageBase64: z.string().trim().optional(),
  sessionContext: sessionContextSchema.optional(),
}).superRefine((value, ctx) => {
  const hasAwb = Boolean(String(value.awb || '').trim());
  const hasImage = Boolean(String(value.imageBase64 || '').trim() || String(value.focusImageBase64 || '').trim());
  if (!hasAwb && !hasImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['awb'],
      message: 'Provide awb, imageBase64, or focusImageBase64.',
    });
  }
});
const scanAwbBulkSchema    = z.object({ 
  awbs: z.array(z.string().trim().min(1)).min(1, 'At least one AWB is required').max(200, 'Max 200 AWBs per request'),
  courier: z.enum(['Delhivery','Trackon','DTDC','AUTO']).default('AUTO'),
  captureOnly: z.coerce.boolean().optional().default(false),
});

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
    service:     z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(v => String(v || 'Standard')),
    // Status from Excel is intentionally ignored; import always starts as Booked.
    status:      z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(() => ''),
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
  notificationConfig: z.any().optional(),
});

const contractSchema = z.object({
  id:           z.coerce.number().int().positive().optional(),
  clientCode:   z.string().min(1).transform(v => v.toUpperCase()),
  name:         z.string().min(1, 'Contract name required'),
  courier:      optStr.optional(),
  service:      optStr.optional(),
  pricingType:  z.enum(['PER_KG','FLAT','PER_SHIPMENT','MATRIX']).default('PER_KG'),
  baseRate:     z.coerce.number().min(0).default(0),
  baseCharge:   z.coerce.number().min(0).default(0),
  minCharge:    z.coerce.number().min(0).default(0),
  fuelSurcharge:z.coerce.number().min(0).default(0),
  gstPercent:   z.coerce.number().min(0).default(18),
  pricingRules: z.array(z.object({
    mode: z.string().min(1),
    zone: z.string().min(1),
    weightSlab: z.string().min(1),
    rate: z.coerce.number().min(0).default(0),
    minCharge: z.coerce.number().min(0).default(0),
    baseCharge: z.coerce.number().min(0).default(0),
    perKgRate: z.coerce.number().min(0).default(0),
  })).optional().default([]),
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

module.exports = { shipmentSchema,  updateShipmentSchema,
  statusUpdateSchema,
  scanAwbSchema,
  scanImageSchema,
  scanMobileSchema,
  scanAwbBulkSchema,
  importSchema, clientSchema, contractSchema, invoiceSchema };
