const { z } = require('zod');

const autoSuggestSchema = z.object({
  pincode: z.union([z.string(), z.number()]).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  weight: z.coerce.number().min(0.01, 'Weight must be greater than 0'),
  shipType: z.enum(['doc', 'nondoc', 'surface']).default('doc'),
  clientCode: z.string().optional()
}).refine(data => data.state || data.pincode, {
  message: "Either state or pincode is required",
  path: ["pincode"]
});

const bulkCalculateSchema = z.object({
  shipments: z.array(z.object({
    ref: z.union([z.string(), z.number()]).optional(),
    awb: z.union([z.string(), z.number()]).optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    weight: z.coerce.number().min(0.01, 'Weight must be greater than 0'),
    shipType: z.string().default('doc')
  })).min(1, 'At least one shipment is required for bulk calculation').max(500, 'Max 500 shipments per request')
});

const verifySchema = z.object({
  lines: z.array(z.object({
    awb: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    pincode: z.string().optional(),
    weight: z.coerce.number().optional(),
    amount: z.coerce.number().optional(),
    serviceCode: z.string().optional(),
    service: z.string().optional(),
    courierId: z.string().optional(),
  })).min(1, 'At least one line is required for verification').max(1000, 'Max 1000 lines per request')
});

module.exports = {
  autoSuggestSchema,
  bulkCalculateSchema,
  verifySchema
};
