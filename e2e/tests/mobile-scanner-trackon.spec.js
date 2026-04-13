'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Mobile scanner Trackon normalization', () => {
  test('normalizes a raw Trackon decode before capture', async ({ page }) => {
    await page.goto('/mobile-scanner/TESTPIN123?mock=1&e2e=1&mockBarcodeRaw=0500602752638');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('[data-testid="start-scan-btn"]:visible').first().click();
    await expect(page.getByText('500602752638').first()).toBeVisible({ timeout: 15000 });

    const mockCaptureBtn = page.locator('[data-testid="mock-capture-btn"]:visible').first();
    await expect(mockCaptureBtn).toBeVisible();
    await mockCaptureBtn.click();

    const usePhotoBtn = page.locator('[data-testid="use-photo-btn"]:visible').first();
    await expect(usePhotoBtn).toBeVisible();
    await usePhotoBtn.click();

    await expect(page.locator('[data-testid="scan-next-btn"]:visible').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('500602752638').last()).toBeVisible();
  });
});
