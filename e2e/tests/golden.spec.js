'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Golden path (demo users)', () => {
  test('public home loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sea Hawk/i);
    await expect(page.getByRole('heading', { name: /India's Most Trusted/i })).toBeVisible();
  });

  test('health API returns success envelope', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
    expect(body.data.status).toBe('healthy');
    expect(body.data.database).toBe('connected');
    expect(['not_configured', 'connected', 'unavailable', 'error']).toContain(body.data.redis);
  });

  test('staff login reaches /app', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('admin@seahawk.com');
    await page.locator('#password').fill('Admin@12345');
    await page.getByRole('button', { name: /Launch Dashboard/i }).click();
    await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
  });

  test('client login reaches /portal', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/portal/login');
    await page.locator('#email').fill('client.user@seahawk.com');
    await page.locator('#password').fill('Client@12345');
    await page.getByRole('button', { name: /Sign In to Client Portal/i }).click();
    await page.waitForURL(/\/portal/, { timeout: 30_000 });
  });
});
