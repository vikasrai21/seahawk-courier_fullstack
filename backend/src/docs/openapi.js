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
