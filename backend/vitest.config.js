import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    setupFiles:  ['./src/tests/setup.js'],
    coverage:    { reporter: ['text', 'lcov'], exclude: ['node_modules', 'src/tests'] },
  },
});
