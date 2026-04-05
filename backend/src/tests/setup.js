// src/tests/setup.js
'use strict';

// Basic global mocks
const mockPrisma = require('../config/__mocks__/prisma.js');
global.mockPrisma = mockPrisma;

global.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
  arrayBuffer: async () => new ArrayBuffer(0),
}));

module.exports = { mockPrisma };
