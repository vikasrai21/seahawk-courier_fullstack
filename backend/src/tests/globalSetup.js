const { execSync } = require('child_process');
const dotenv = require('dotenv');

module.exports = async function setup() {
  console.log('🚀 Setting up Integration Test Database...');

  // Load .env.test only if the parent process has not already provided a test URL.
  if (!process.env.TEST_DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
  }

  let testDbUrl = process.env.TEST_DATABASE_URL;
  const generatedSchema = `test_suite_${Date.now()}_${process.pid}`;

  if (!testDbUrl) {
    console.error('❌ TEST_DATABASE_URL is not set in .env.test. Aborting to protect active data.');
    process.exit(1);
  }

  // Use a unique schema per run to avoid Postgres catalog collisions across repeated pushes.
  if (testDbUrl.startsWith('postgresql://') || testDbUrl.startsWith('postgres://')) {
    try {
      const urlInfo = new URL(testDbUrl);
      urlInfo.searchParams.set('schema', process.env.TEST_DATABASE_SCHEMA || generatedSchema);
      testDbUrl = urlInfo.toString();
      process.env.TEST_DATABASE_SCHEMA = urlInfo.searchParams.get('schema');
      console.log(`🔒 Using isolated test schema: ${process.env.TEST_DATABASE_SCHEMA}`);
    } catch (e) {
      console.warn('⚠️ Could not parse TEST_DATABASE_URL safely.');
    }
  }

  // Override DATABASE_URL for Prisma executions
  process.env.DATABASE_URL = testDbUrl;
  process.env.TEST_DATABASE_URL = testDbUrl;

  // Signal to prisma.js to use the REAL PrismaClient, not the mock
  process.env.INTEGRATION_TEST = 'true';

  try {
    // Push the schema directly without migrations history (perfect for tests).
    // Skip generation here to avoid Windows file-lock churn during repeated test setup.
    console.log('📦 Pushing Prisma schema to test database...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDbUrl },
    });
    console.log('✅ Test database ready.\n');
  } catch (error) {
    console.error('❌ Failed to push schema to test database:', error.message);
    process.exit(1);
  }
};
