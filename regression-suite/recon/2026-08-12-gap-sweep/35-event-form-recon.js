require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;
async function acceptTos(page) {
  await page.waitForTimeout(2500);
  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 8) {
    guard++;
    const cb = page.getByRole('checkbox');
    if (await cb.count()) await cb.first().check();
    const submitBtn = page.getByRole('button', { name: /^submit$/i });
    if (await submitBtn.count()) { await submitBtn.click(); await page.waitForTimeout(1200); continue; }
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
  await page.waitForTimeout(2000);
  await page.locator('a:has-text("Events")').first().click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /add new event/i }).click();
  await page.waitForTimeout(1000);

  // click the date range field
  await page.getByPlaceholder(/eg: 2025/i).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/35-date-range-open.png', fullPage: true });

  const labels = await page.locator('label').allInnerTexts();
  console.log('LABELS:', JSON.stringify(labels));
  const buttons = await page.getByRole('button').allInnerTexts();
  console.log('BUTTONS near calendar:', JSON.stringify(buttons.slice(0,15)));

  await browser.close();
})();
