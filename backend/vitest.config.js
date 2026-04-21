import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 30,
        functions: 35,
        branches: 50,
        statements: 30,
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
  },
});
