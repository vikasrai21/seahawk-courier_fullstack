/**
 * Integration test setup — runs inside each test worker process.
 * Sets the environment variables BEFORE any module loads Prisma.
 */
const dotenv = require('dotenv');

// 1. Load the main .env first (for JWT_SECRET, config, etc.)
dotenv.config({ path: '.env' });

// 2. Load .env.test only when a test URL was not already injected by global setup.
if (!process.env.TEST_DATABASE_URL) {
  dotenv.config({ path: '.env.test', override: true });
}

let testDbUrl = process.env.TEST_DATABASE_URL;
if (testDbUrl) {
  // Ensure schema isolation
  if (testDbUrl.startsWith('postgresql://') || testDbUrl.startsWith('postgres://')) {
    try {
      const urlInfo = new URL(testDbUrl);
      urlInfo.searchParams.set('schema', process.env.TEST_DATABASE_SCHEMA || urlInfo.searchParams.get('schema') || 'test_suite');
      testDbUrl = urlInfo.toString();
    } catch (_) {}
  }
  process.env.DATABASE_URL = testDbUrl;
  process.env.TEST_DATABASE_URL = testDbUrl;
}

// Signal to prisma.js to use the REAL PrismaClient, not the mock
process.env.INTEGRATION_TEST = 'true';
