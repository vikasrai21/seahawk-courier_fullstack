import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    setupFiles:  ['./src/tests/setup.js'],
    coverage: {
      reporter: ['text', 'json-summary', 'lcov'],
      exclude: [
        'node_modules',
        'scripts/**',
        'src/tests',
        'src/app.js',
        'src/realtime/**',
        'server.js',
        'public/**',
        'src/routes/**',
        'src/controllers/**',
        'src/docs/**',
        'src/workers/**',
        'src/services/analytics.service.js',
        'src/services/auditor.service.js',
        'src/services/**',
        'src/utils/**',
        'src/config/prisma.js',
        'src/config/redis.js',
        'src/utils/seed.js',
      ],
    },
  },
});
