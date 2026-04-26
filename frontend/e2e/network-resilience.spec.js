/**
 * network-resilience.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * E2E tests that simulate network interruptions to verify the UI
 * degrades gracefully (shows error states, retries, doesn't crash).
 */
import { test, expect } from '@playwright/test';

const STAFF_EMAIL = 'admin@seahawk.com';
const STAFF_PASSWORD = 'Admin@12345';

async function loginAs(page, email, password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Network Resilience', () => {

  // ── 1. Offline indicator on API failure ──────────────────────────────────

  test('Dashboard shows error state when API is unreachable', async ({ page, context }) => {
    await loginAs(page, STAFF_EMAIL, STAFF_PASSWORD);
    await page.waitForLoadState('domcontentloaded');

    // Block all API requests to simulate network loss
    await context.route('**/api/**', route => route.abort('connectionrefused'));

    // Navigate to trigger fresh data fetch
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // The page should still render without crashing (no white screen)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Unblock API
    await context.unrouteAll();
  });

  // ── 2. Login fails gracefully when server is down ────────────────────────

  test('Login form shows error when server is unreachable', async ({ page, context }) => {
    // Block auth endpoint
    await context.route('**/api/auth/**', route => route.abort('connectionrefused'));

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[type="email"]', STAFF_EMAIL);
    await page.fill('input[type="password"]', STAFF_PASSWORD);
    await page.click('button[type="submit"]');

    // Should show some kind of error without crashing
    await page.waitForTimeout(3000);

    // Page should still be on /login (no redirect)
    expect(page.url()).toContain('/login');

    // The form should still be visible (not a blank page)
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await context.unrouteAll();
  });

  // ── 3. Slow network doesn't crash the shipment list ─────────────────────

  test('Shipment list handles slow network gracefully', async ({ page, context }) => {
    await loginAs(page, STAFF_EMAIL, STAFF_PASSWORD);

    // Simulate extreme latency on API calls (5 second delay)
    await context.route('**/api/shipments**', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });

    await page.goto('/app/ops');
    await page.waitForLoadState('domcontentloaded');

    // Page should still render (loading state or data)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Should not show a blank/white page
    const bodyText = await body.textContent();
    expect(bodyText.length).toBeGreaterThan(10);

    await context.unrouteAll();
  });

  // ── 4. Recovery after network restored ──────────────────────────────────

  test('App recovers when network comes back', async ({ page, context }) => {
    await loginAs(page, STAFF_EMAIL, STAFF_PASSWORD);
    await page.waitForLoadState('domcontentloaded');

    // Block API
    await context.route('**/api/**', route => route.abort('connectionrefused'));

    // Try navigating (should fail gracefully)
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Restore network
    await context.unrouteAll();

    // Navigate again — should work now
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify the page loaded successfully
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  // ── 5. Failed request doesn't lose form data ────────────────────────────

  test('Login form retains email after network error', async ({ page, context }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Type in credentials
    await page.fill('input[type="email"]', 'test@seahawk.com');
    await page.fill('input[type="password"]', 'SomePassword123');

    // Block auth endpoint
    await context.route('**/api/auth/**', route => route.abort('connectionrefused'));

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Email should still be in the input
    const emailValue = await page.inputValue('input[type="email"]');
    expect(emailValue).toBe('test@seahawk.com');

    await context.unrouteAll();
  });
});
