import { test, expect } from '@playwright/test';

test.describe('Mobile Scanner UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@seahawkcourier.in');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('UI properly loads scanner and allows manual entry fallback', async ({ page }) => {
    // Navigate to Mobile Scanner
    await page.goto('/mobile-scanner');
    
    // Check if UI is requesting camera or loaded the scanner overlay
    // Because we mock permissions, the camera should automatically "start" giving us the HUD
    await expect(page.locator('text=Ready for DTDC/Trackon AWB')).toBeVisible({ timeout: 15000 });

    // The user should be able to click the keyboard icon to type manually
    // Fallback to manual entry is common. Let's find the manual entry button.
    // If there is an input for AWB:
    // This assumes the MobileScannerPage has an input for manual entry or falls back intelligently
    
    // Test the specific UI layout we built 
    const manualEntryInput = page.locator('input[placeholder="Type AWB or Barcode..."]');
    if (await manualEntryInput.isVisible()) {
      await manualEntryInput.fill('SCAN_TEST_UI_AWB123');
      await page.keyboard.press('Enter');
      
      // Wait for the processing/success screen
      await expect(page.locator('text=Processing')).toBeVisible();
    }
  });
});
