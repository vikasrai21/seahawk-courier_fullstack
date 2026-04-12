import { test, expect } from '@playwright/test';

test.describe('Shipment Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before the test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@seahawkcourier.in');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Creates a successful shipment through the UI', async ({ page }) => {
    // Navigate to Create Shipment
    await page.goto('/shipments/new');
    await expect(page.locator('h1', { hasText: 'Create Shipment' })).toBeVisible();

    // Fill form
    const uniqueAwb = `E2EAWB${Date.now()}`;
    await page.fill('input[placeholder="Scan or enter AWB"]', uniqueAwb);
    
    // Fill client details (Select MISC)
    // Wait for clients to load, then select MISC or just type
    await page.fill('input[name="consignee"]', 'Playwright E2E User');
    await page.fill('input[name="destination"]', 'PLAYWRIGHT CITY');
    await page.fill('input[name="weight"]', '2.5');
    
    // Select Courier
    await page.selectOption('select[name="courier"]', 'Delhivery');

    // Submit form
    await page.click('button:has-text("Create Shipment")');

    // Wait for success toast
    await expect(page.locator('text=Shipment created successfully')).toBeVisible({ timeout: 10000 });

    // Should redirect to shipments list or clear form
    await page.goto('/shipments');
    await expect(page.locator(`text=${uniqueAwb}`)).toBeVisible({ timeout: 10000 });
  });
});
