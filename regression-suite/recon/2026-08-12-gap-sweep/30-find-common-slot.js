require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const BASE = process.env.O2O_STAGING_BASE_URL;
async function login(page, username, password) {
  await page.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await page.waitForTimeout(3000);
  if (page.url().includes('terms-of-service')) {
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /^submit$/i }).click();
    await page.waitForTimeout(1500);
  }
}
(async () => {
  const browser = await chromium.launch();
  const alex = await browser.newPage();
  await login(alex, process.env.O2O_BOOKING_DELEGATE_A_USERNAME, process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await alex.locator('a:has-text("Meetings")').first().click();
  await alex.waitForTimeout(1500);
  // find time labels that are "Available" - look for text pattern near "Available"
  const slots = await alex.evaluate(() => {
    const results = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && /^\d{2}:\d{2} - \d{2}:\d{2}$/.test(el.textContent.trim())) {
        const parent = el.closest('div');
        const hasAvailable = parent && parent.textContent.includes('Available');
        if (hasAvailable) results.push(el.textContent.trim());
      }
    });
    return [...new Set(results)];
  });
  console.log('Alex available time slots (first 10):', slots.slice(0, 10));
  await browser.close();
})();
