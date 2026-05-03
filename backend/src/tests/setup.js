const { _mockTx } = require('../config/__mocks__/prisma.js');
const mockPrisma = require('../config/__mocks__/prisma.js');

// ── Global prisma mock — ensures ALL unit tests use the mock, not real DB ──
vi.mock('../../config/prisma', () => require('../../config/__mocks__/prisma.js'));
vi.mock('../config/prisma', () => require('../config/__mocks__/prisma.js'));

global.mockPrisma = mockPrisma;
global.mockTx = _mockTx;

global.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
  arrayBuffer: async () => new ArrayBuffer(0),
}));

module.exports = { mockPrisma, mockTx: _mockTx };
