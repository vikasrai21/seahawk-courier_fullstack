import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
      include: [
        'src/controllers/**/*.js',
        'src/services/**/*.js',
        'src/config/queue.js',
        'src/utils/**/*.js',
        'src/middleware/**/*.js'
      ],
      exclude: [
        'node_modules',
        'scripts/**',
        'src/tests/**',
        'src/utils/bootstrap-*.js',
        'src/utils/seed.js'
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/tests/unit/**/*.test.js'],
          setupFiles: ['./src/tests/setup.js'],
          environment: 'node',
          testTimeout: 15000,
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/tests/integration/**/*.test.js'],
          setupFiles: ['./src/tests/setupIntegration.js'],
          globalSetup: ['./src/tests/globalSetup.js'],
          testTimeout: 30000,
          environment: 'node',
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            }
          }
        }
      }
    ]
  },
});
