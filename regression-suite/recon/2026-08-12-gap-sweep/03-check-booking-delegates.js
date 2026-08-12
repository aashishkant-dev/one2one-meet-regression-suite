require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const BASE = process.env.O2O_STAGING_BASE_URL;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await page.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await page.waitForTimeout(3000);
  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 8) {
    guard++;
    const cb = page.getByRole('checkbox');
    if (await cb.count()) await cb.first().check();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(1200);
  }
  await page.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });

  // switch to Booking Test Event via header pill
  await page.locator('header').getByRole('button').first().click();
  await page.getByText('Booking Test Event', { exact: true }).first().click();
  await page.waitForTimeout(2500);

  await page.locator('a:has-text("Delegates")').first().click();
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());
  const rows = await page.getByRole('row').allInnerTexts();
  console.log('ROWS:\n' + rows.join('\n---\n'));
  await page.screenshot({ path: __dirname + '/out/booking-delegates.png', fullPage: true });
  await browser.close();
})();
