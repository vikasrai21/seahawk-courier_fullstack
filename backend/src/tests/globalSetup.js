const { execSync } = require('child_process');
const dotenv = require('dotenv');

module.exports = async function setup() {
  console.log('🚀 Setting up Integration Test Database...');

  // Load .env.test
  dotenv.config({ path: '.env.test' });

  let testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    console.error('❌ TEST_DATABASE_URL is not set in .env.test. Aborting to protect active data.');
    process.exit(1);
  }

  // Ensure we are isolated to `test_suite` schema if on Postgres
  if (testDbUrl.startsWith('postgresql://') || testDbUrl.startsWith('postgres://')) {
    try {
      const urlInfo = new URL(testDbUrl);
      if (!urlInfo.searchParams.has('schema')) {
        urlInfo.searchParams.set('schema', 'test_suite');
        testDbUrl = urlInfo.toString();
        console.log(`🔒 Appended ?schema=test_suite to protect active data.`);
      }
    } catch (e) {
      console.warn('⚠️ Could not parse TEST_DATABASE_URL safely.');
    }
  }

  // Override DATABASE_URL for Prisma executions
  process.env.DATABASE_URL = testDbUrl;

  // Signal to prisma.js to use the REAL PrismaClient, not the mock
  process.env.INTEGRATION_TEST = 'true';

  try {
    // Push the schema directly without migrations history (perfect for tests).
    // Do not skip generation so Prisma client always matches the latest schema.
    console.log('📦 Pushing Prisma schema to test database...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDbUrl },
    });
    console.log('✅ Test database ready.\n');
  } catch (error) {
    console.error('❌ Failed to push schema to test database:', error.message);
    process.exit(1);
  }
};
