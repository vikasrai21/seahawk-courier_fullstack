import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can login and is redirected to dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Check if we are on the login page (h2 contains Sea Hawk Courier)
    await expect(page.locator('h2', { hasText: 'Sea Hawk Courier' })).toBeVisible();

    // Fill credentials (assuming STAFF test credentials)
    await page.fill('input[type="email"]', 'admin@seahawk.com');
    await page.fill('input[type="password"]', 'Admin@12345');

    // Click Login
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/app.*/);

    // Verify Dashboard loads successfully
    await expect(page.locator('h1', { hasText: 'Command Center' })).toBeVisible({ timeout: 10000 });
  });

  test('Shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@seahawkcourier.in');
    await page.fill('input[type="password"]', 'badpassword');
    await page.click('button[type="submit"]');

    // Verify error toast/message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
