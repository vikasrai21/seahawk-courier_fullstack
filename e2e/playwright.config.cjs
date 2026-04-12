'use strict';

const { defineConfig, devices } = require('@playwright/test');

/**
 * Golden-path E2E tests. Run against a live stack:
 *   Terminal 1: cd backend && npm run dev   (or npm start with env)
 *   Terminal 2: cd frontend && npm run dev
 *   Terminal 3: npm run test:e2e (from repo root)
 *
 * CI starts servers in GitHub Actions before invoking Playwright.
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
