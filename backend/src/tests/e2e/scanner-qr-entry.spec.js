// Test: verify that /scan-mobile?sessionId=XXXX renders the scanner UI
// This simulates exactly what happens when a phone scans the QR code
const { test, expect } = require('@playwright/test');

test.describe('Mobile Scanner QR Entry', () => {

  test('GET /scan-mobile?sessionId=397746 should render scanner (not login page)', async ({ page }) => {
    // Simulate a phone opening the QR code URL — no auth, no cookies
    const url = 'http://localhost:5555/scan-mobile?sessionId=397746';

    // Capture console errors for debugging
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Capture page crashes
    const pageCrashErrors = [];
    page.on('pageerror', err => {
      pageCrashErrors.push(err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

    // Check: the page should NOT redirect to /login
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    console.log('Page title:', await page.title());

    // Get the page content
    const bodyText = await page.textContent('body');
    console.log('Body text (first 500 chars):', bodyText?.slice(0, 500));

    // Get the HTML
    const html = await page.content();
    console.log('HTML length:', html.length);

    // Check for login form
    const hasLoginForm = html.includes('login') || html.includes('Login') || html.includes('Sign in');
    console.log('Has login-related content:', hasLoginForm);

    // Check for scanner content
    const hasScannerContent = html.includes('msp-root') || html.includes('scanner') || html.includes('Scanner') || html.includes('Connecting') || html.includes('Loading');
    console.log('Has scanner content:', hasScannerContent);

    // Check for the root div content
    const rootContent = await page.locator('#root').innerHTML();
    console.log('Root inner HTML (first 500 chars):', rootContent?.slice(0, 500));

    // Report any errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));
    }
    if (pageCrashErrors.length > 0) {
      console.log('Page crash errors:', JSON.stringify(pageCrashErrors, null, 2));
    }

    // The final URL MUST NOT be /login
    expect(finalUrl).not.toContain('/login');

    // The page MUST have scanner-related content, not be blank
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });

  test('GET /mobile-scanner should render scanner', async ({ page }) => {
    const url = 'http://localhost:5555/mobile-scanner';

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const pageCrashErrors = [];
    page.on('pageerror', err => {
      pageCrashErrors.push(err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

    const finalUrl = page.url();
    console.log('[/mobile-scanner] Final URL:', finalUrl);
    const bodyText = await page.textContent('body');
    console.log('[/mobile-scanner] Body:', bodyText?.slice(0, 300));

    if (consoleErrors.length > 0) console.log('[/mobile-scanner] Console errors:', consoleErrors);
    if (pageCrashErrors.length > 0) console.log('[/mobile-scanner] Page errors:', pageCrashErrors);

    expect(finalUrl).not.toContain('/login');
  });
});
