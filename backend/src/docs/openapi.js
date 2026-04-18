'use strict';

function baseSpec(serverUrl) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Sea Hawk Courier API',
      version: '1.0.0',
      description: 'Operational, client portal, tracking and webhook APIs for Sea Hawk.',
    },
    servers: [
      { url: serverUrl || 'http://localhost:3001', description: 'Current environment' },
    ],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Shipments' },
      { name: 'Returns' },
      { name: 'Public Tracking' },
      { name: 'Webhooks' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@seahawk.com' },
            password: { type: 'string', example: 'StrongPassword123!' },
          },
        },
        Shipment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            awb: { type: 'string' },
            clientCode: { type: 'string' },
            status: { type: 'string' },
            courier: { type: 'string' },
            destination: { type: 'string' },
            date: { type: 'string', format: 'date' },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            200: { description: 'Healthy' },
            503: { description: 'Unhealthy' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Logged in' },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          responses: { 200: { description: 'Refreshed' }, 401: { description: 'Invalid refresh token' } },
        },
      },
      '/api/shipments': {
        get: {
          tags: ['Shipments'],
          summary: 'List shipments (paginated)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Shipment list' }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['Shipments'],
          summary: 'Create shipment',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Shipment' },
              },
            },
          },
          responses: { 201: { description: 'Created' }, 400: { description: 'Validation error' } },
        },
      },
      '/api/shipments/import': {
        post: {
          tags: ['Shipments'],
          summary: 'Bulk import shipments',
          description: 'Accepts larger JSON payload than global API limit.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shipments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Shipment' },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Import result' }, 413: { description: 'Payload too large' } },
        },
      },
      '/api/public/track/{awb}': {
        get: {
          tags: ['Public Tracking'],
          summary: 'Track a shipment by AWB',
          parameters: [{ name: 'awb', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Tracking result' }, 404: { description: 'Not found' } },
        },
      },
      '/api/public/integrations/ecommerce/{provider}/{clientCode}': {
        post: {
          tags: ['Webhooks'],
          summary: 'Marketplace/OMS ingestion endpoint',
          description: 'Create draft orders from external systems using x-api-key and optional Idempotency-Key.',
          parameters: [
            { name: 'provider', in: 'path', required: true, schema: { type: 'string', example: 'amazon' } },
            { name: 'clientCode', in: 'path', required: true, schema: { type: 'string', example: 'CLIENT001' } },
            { name: 'x-api-key', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'Idempotency-Key', in: 'header', required: false, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: true },
              },
            },
          },
          responses: {
            201: { description: 'Draft created from payload' },
            200: { description: 'Duplicate/idempotent replay ignored' },
            401: { description: 'Invalid API key' },
            403: { description: 'Scope or provider disabled' },
          },
        },
      },
      '/api/public/rum': {
        post: {
          tags: ['Public Tracking'],
          summary: 'Receive Real User Monitoring metrics',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string', example: 'LCP' },
                    value: { type: 'number', example: 1280.42 },
                    page: { type: 'string', example: '/track/123456' },
                  },
                },
              },
            },
          },
          responses: { 202: { description: 'Accepted' } },
        },
      },
      '/api/returns': {
        get: {
          tags: ['Returns'],
          summary: 'List return requests',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'returnMethod', in: 'query', schema: { type: 'string', enum: ['PICKUP', 'SELF_SHIP'] } },
            { name: 'reason', in: 'query', schema: { type: 'string' } },
            { name: 'clientCode', in: 'query', schema: { type: 'string' } },
            { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Return list' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/returns/{id}/book-pickup': {
        post: {
          tags: ['Returns'],
          summary: 'Book reverse return shipment for a return request',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Reverse pickup booked' }, 400: { description: 'Booking failed' } },
        },
      },
      '/api/returns/{id}/generate-label': {
        post: {
          tags: ['Returns'],
          summary: 'Generate prepaid self-ship return label',
          description: 'Works only for return requests with returnMethod = SELF_SHIP.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Prepaid return label generated' }, 400: { description: 'Label generation failed' } },
        },
      },
      '/api/returns/{id}/sync-tracking': {
        post: {
          tags: ['Returns'],
          summary: 'Sync reverse-tracking status for one return request',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Reverse tracking synced' }, 400: { description: 'Sync failed' } },
        },
      },
      '/api/returns/{id}/timeline': {
        get: {
          tags: ['Returns'],
          summary: 'Get return audit timeline',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, minimum: 5, maximum: 200 } },
          ],
          responses: { 200: { description: 'Timeline entries' }, 404: { description: 'Return not found' } },
        },
      },
      '/api/returns/{id}/status': {
        patch: {
          tags: ['Returns'],
          summary: 'Manually update return status',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['PENDING', 'APPROVED', 'LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT', 'RECEIVED', 'RETURNED_TO_CLIENT', 'REJECTED'] },
                    force: { type: 'boolean', default: false },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' }, 409: { description: 'Invalid status transition' } },
        },
      },
      '/api/returns/sync-tracking': {
        post: {
          tags: ['Returns'],
          summary: 'Sync reverse-tracking status for active return requests',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { limit: { type: 'integer', example: 100 } },
                },
              },
            },
          },
          responses: { 200: { description: 'Bulk sync completed' }, 400: { description: 'Sync failed' } },
        },
      },
      '/api/webhooks/delhivery': {
        post: {
          tags: ['Webhooks'],
          summary: 'Delhivery webhook receiver',
          description: 'Requires HMAC signature headers when webhook secret is configured.',
          parameters: [
            { name: 'x-webhook-signature', in: 'header', schema: { type: 'string' } },
            { name: 'x-webhook-timestamp', in: 'header', schema: { type: 'string' } },
            { name: 'x-webhook-id', in: 'header', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Webhook accepted' }, 401: { description: 'Invalid signature' } },
        },
      },
      '/api/webhooks/dtdc': {
        post: {
          tags: ['Webhooks'],
          summary: 'DTDC webhook receiver',
          parameters: [
            { name: 'x-webhook-signature', in: 'header', schema: { type: 'string' } },
            { name: 'x-webhook-timestamp', in: 'header', schema: { type: 'string' } },
            { name: 'x-webhook-id', in: 'header', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Webhook accepted' }, 401: { description: 'Invalid signature' } },
        },
      },
    },
  };
}

module.exports = { baseSpec };
