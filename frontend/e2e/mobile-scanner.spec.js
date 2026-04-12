import { test, expect } from '@playwright/test';

test.describe('Mobile scanner mock flow', () => {
  test('manual AWB to success without camera or socket', async ({ page }) => {
    await page.goto('/mobile-scanner/TESTPIN123?mock=1&e2e=1');
    await page.waitForLoadState('domcontentloaded');

    const diagToggle = page.getByTestId('scanner-diag-toggle');
    await expect(diagToggle).toBeVisible({ timeout: 20000 });
    await diagToggle.click();

    const diagPanel = page.getByTestId('scanner-diag-panel');
    await expect(diagPanel).toBeVisible();
    await expect(diagPanel).toContainText('Connection');
    await expect(diagPanel).toContainText('paired');
    await expect(diagPanel).toContainText('Step');
    await expect(diagPanel).toContainText('IDLE');

    const awbInput = page.locator('[data-testid="manual-awb-input"]:visible').first();
    await expect(awbInput).toBeVisible({ timeout: 20000 });
    await awbInput.fill('AWB1234567');
    await page.locator('[data-testid="manual-awb-submit"]:visible').first().click();

    await expect(diagPanel).toContainText('CAPTURING');
    await expect(diagPanel).toContainText('ready');
    await expect(diagPanel).toContainText('AWB1234567');

    const mockCaptureBtn = page.locator('[data-testid="mock-capture-btn"]:visible').first();
    await expect(mockCaptureBtn).toBeVisible();
    await mockCaptureBtn.click();

    const usePhotoBtn = page.locator('[data-testid="use-photo-btn"]:visible').first();
    await expect(usePhotoBtn).toBeVisible();
    await usePhotoBtn.click();

    await expect(page.locator('[data-testid="scan-next-btn"]:visible').first()).toBeVisible({ timeout: 15000 });
    await expect(diagPanel).toContainText('SUCCESS');
  });
});
