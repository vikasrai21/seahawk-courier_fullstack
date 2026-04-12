import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      all: true,
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/controllers/**/*.js',
        'src/services/**/*.js',
        'src/config/queue.js',
        'src/rates/**/*.js',
        'src/utils/**/*.js',
        'src/validators/**/*.js',
      ],
      exclude: [
        'node_modules',
        'scripts/**',
        'src/tests/**',
      ],
    },
  },
});
