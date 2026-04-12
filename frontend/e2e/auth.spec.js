import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can login and is redirected to dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Check if we are on the login page
    await expect(page.locator('h2', { hasText: 'Sign in to Seahawk' })).toBeVisible();

    // Fill credentials (assuming STAFF test credentials)
    await page.fill('input[type="email"]', 'admin@seahawkcourier.in');
    await page.fill('input[type="password"]', 'AdminPass123!');

    // Click Login
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify Dashboard loads successfully
    await expect(page.locator('h1', { hasText: 'Logistics Overview' })).toBeVisible({ timeout: 10000 });
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
