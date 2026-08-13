require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const BASE = process.env.O2O_STAGING_BASE_URL;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await page.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await page.waitForTimeout(3000);
  if (page.url().includes('terms-of-service')) {
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /^submit$/i }).click();
    await page.waitForTimeout(1500);
  }
  await page.locator('a:has-text("Meetings")').first().click();
  await page.waitForTimeout(1000);
  await page.getByText('Meeting Reports', { exact: true }).click();
  await page.waitForTimeout(1500);
  console.log('Meeting Report URL:', page.url());

  // capture any API calls with an ID
  const apiCalls = [];
  page.on('request', r => { if (r.url().includes('/api/') && /report|meeting/i.test(r.url())) apiCalls.push(r.url()); });
  await page.reload();
  await page.waitForTimeout(2000);
  console.log('API calls:', JSON.stringify(apiCalls, null, 2));
  await browser.close();
})();
