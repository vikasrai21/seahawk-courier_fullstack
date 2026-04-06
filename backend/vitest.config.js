import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    setupFiles:  ['./src/tests/setup.js'],
    coverage: {
      all: true,
      reporter: ['text', 'json-summary', 'lcov'],
      include: [
        'src/config/queue.js',
        'src/rates/delhivery.js',
        'src/rates/dtdc.js',
        'src/rates/network.js',
        'src/rates/trackon.js',
        'src/utils/cache.js',
        'src/utils/bootstrap-guard.js',
        'src/utils/response.js',
        'src/validators/**/*.js',
      ],
      exclude: [
        'node_modules',
        'scripts/**',
        'src/tests',
      ],
    },
  },
});
