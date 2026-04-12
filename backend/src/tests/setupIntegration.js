/**
 * Integration test setup — runs inside each test worker process.
 * Sets the environment variables BEFORE any module loads Prisma.
 */
const dotenv = require('dotenv');

// 1. Load the main .env first (for JWT_SECRET, config, etc.)
dotenv.config({ path: '.env' });

// 2. Load .env.test to override DATABASE_URL with the test URL
dotenv.config({ path: '.env.test', override: true });

let testDbUrl = process.env.TEST_DATABASE_URL;
if (testDbUrl) {
  // Ensure schema isolation
  if (testDbUrl.startsWith('postgresql://') || testDbUrl.startsWith('postgres://')) {
    try {
      const urlInfo = new URL(testDbUrl);
      if (!urlInfo.searchParams.has('schema')) {
        urlInfo.searchParams.set('schema', 'test_suite');
        testDbUrl = urlInfo.toString();
      }
    } catch (_) {}
  }
  process.env.DATABASE_URL = testDbUrl;
}

// Signal to prisma.js to use the REAL PrismaClient, not the mock
process.env.INTEGRATION_TEST = 'true';
