'use strict';
const { z } = require('zod');

const bulkStatusSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'At least one shipment id is required').max(500, 'Max 500 shipments per request'),
  status: z.enum(['Booked', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'RTO', 'Cancelled']),
});

module.exports = { bulkStatusSchema };
