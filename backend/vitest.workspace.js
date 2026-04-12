import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // 1. Unit Test Workspace
  {
    extends: './vitest.config.js',
    test: {
      name: 'unit',
      include: ['src/tests/unit/**/*.test.js'],
      setupFiles: ['./src/tests/setup.js'], // Uses Prisma mocks for speed
      environment: 'node',
    },
  },
  // 2. Integration / E2E Test Workspace
  {
    extends: './vitest.config.js',
    test: {
      name: 'integration',
      include: ['src/tests/integration/**/*.test.js'],
      setupFiles: ['./src/tests/setupIntegration.js'], // Sets INTEGRATION_TEST=true + DATABASE_URL
      globalSetup: ['./src/tests/globalSetup.js'], // Provisions real test schema on Railway
      testTimeout: 30000,
      environment: 'node',
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true, // Prevents DB race conditions 
        }
      }
    },
  }
]);
