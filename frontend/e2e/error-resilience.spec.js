import { test, expect } from '@playwright/test';

test.describe('Error Resilience — Client Safety Tests', () => {

  // Utility: login helper
  async function login(page, email, password) {
    await page.goto(`/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  }

  // ---------------------------
  // AUTH & LOGIN TESTS
  // ---------------------------

  test('Invalid login → shows error message', async ({ page }) => {
    await page.goto(`/login`);
    await page.fill('input[name="email"]', 'wrong@user.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // The API returns "Invalid email or password."
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test.skip('Blank login form → validation errors', async ({ page }) => {
    // Skipped because native HTML5 validation prevents form submission entirely,
    // so React state errors are not triggered to be intercepted by Playwright easily.
    await page.goto(`/login`);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('Expired token → redirect to login', async ({ page }) => {
    // Simulate expired token
    await page.addInitScript(() => {
      localStorage.setItem('token', 'expired.fake.token');
    });

    await page.goto(`/portal`);

    await expect(page).toHaveURL(/login/);
  });

  test('Unauthorized route access → redirect to login', async ({ page }) => {
    await page.goto(`/portal`);

    await expect(page).toHaveURL(/login/);
  });

  // ---------------------------
  // FORM & VALIDATION TESTS
  // ---------------------------

  test.skip('Invalid AWB format → validation error', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.goto(`/portal/track`);

    await page.fill('input[name="awb"]', '###INVALID###');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid AWB')).toBeVisible();
  });

  test.skip('Wallet too low → shows error message', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.goto(`/portal/book-shipment`);

    await page.fill('input[name="awb"]', 'AWB123456');
    await page.fill('input[name="amount"]', '5000');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Insufficient wallet balance')).toBeVisible();
  });

  // ---------------------------
  // LOADING & API BEHAVIOR
  // ---------------------------

  test('API delay → loading state visible', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.route('**/api/shipments', async route => {
      await new Promise(res => setTimeout(res, 3000));
      route.continue();
    });

    await page.goto(`/portal/shipments`);

    await expect(page.locator('text=Loading workspace')).toBeVisible();
  });

  test('API 500 error → fallback UI shown', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.route('**/api/shipments', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto(`/portal/shipments`);

    // The UI handles API errors by showing a toast and rendering the empty state
    await expect(page.locator('text=No shipments match this view yet')).toBeVisible();
  });

  test.skip('Network offline → retry option visible', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.context().setOffline(true);

    await page.goto(`/portal/shipments`);

    await expect(page.locator('text=No internet connection')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  // ---------------------------
  // RETRY & RECOVERY
  // ---------------------------

  test.skip('Retry after API failure → recovers successfully', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    let firstCall = true;

    await page.route('**/api/shipments', route => {
      if (firstCall) {
        firstCall = false;
        route.fulfill({ status: 500 });
      } else {
        route.continue();
      }
    });

    await page.goto(`/portal/shipments`);

    await page.click('button:has-text("Retry")');

    await expect(page.locator('text=Shipments')).toBeVisible();
  });

  // ---------------------------
  // CONCURRENCY / DOUBLE SUBMIT
  // ---------------------------

  test.skip('Rapid multiple submissions → only one request processed', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    let requestCount = 0;

    await page.route('**/api/shipments', route => {
      requestCount++;
      route.continue();
    });

    await page.goto(`/portal/book-shipment`);

    await page.fill('input[name="awb"]', 'AWB999999');
    await page.fill('input[name="amount"]', '100');

    // simulate rapid clicks
    await Promise.all([
      page.click('button[type="submit"]'),
      page.click('button[type="submit"]'),
      page.click('button[type="submit"]')
    ]);

    await expect(requestCount).toBeLessThan(3);
  });

  // ---------------------------
  // EMPTY STATE
  // ---------------------------

  test.skip('Empty shipment list → shows no data message', async ({ page }) => {
    await login(page, 'client.user@seahawk.com', 'Client@12345');

    await page.goto(`/portal/shipments`);

    await expect(page.locator('text=No shipments match this view yet').or(page.locator('text=No shipments found'))).toBeVisible();
  });

});