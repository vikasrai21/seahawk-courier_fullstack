'use strict';

const { defineConfig, devices } = require('@playwright/test');

/**
 * Golden-path E2E tests.
 * Playwright starts backend + frontend automatically when needed and reuses
 * already-running local servers to keep dev workflow fast.
 */
module.exports = defineConfig({
  testDir: './tests',
  globalSetup: './global.setup.cjs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: [
    {
      command: 'npm run start --prefix backend',
      cwd: '..',
      url: 'http://127.0.0.1:3001/api/health',
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173',
      cwd: '..',
      url: 'http://127.0.0.1:5173',
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
