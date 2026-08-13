require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const BASE = process.env.O2O_STAGING_BASE_URL;
async function acceptTos(page) {
  await page.waitForTimeout(3000);
  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 8) {
    guard++;
    const cb = page.getByRole('checkbox');
    if (await cb.count()) await cb.first().check();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(1200);
  }
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await page.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(page);
  await page.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });
  await page.locator('header').getByRole('button').first().click();
  await page.getByText('Booking Test Event', { exact: true }).first().click();
  await page.waitForTimeout(2500);
  await page.goto(BASE + '/organizer/settings');
  await page.waitForTimeout(3000);
  const numbers = await page.locator('input[type="number"]').evaluateAll(els => els.map(e => e.value));
  const checkboxes = await page.locator('input[type="checkbox"]').evaluateAll(els => els.map(e => e.checked));
  console.log('number field values:', numbers);
  console.log('checkbox states:', checkboxes);
  await browser.close();
})();
