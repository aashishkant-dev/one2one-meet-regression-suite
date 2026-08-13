require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
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
  await page.locator('header').getByRole('button').first().click();
  await page.getByText('Past Event', { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.locator('a:has-text("Sponsor Categories")').click();
  await page.waitForTimeout(1500);
  const rows = await page.getByRole('row').allInnerTexts();
  console.log('CATEGORIES:', JSON.stringify(rows.slice(0,10)));

  await page.locator('a:has-text("Delegates")').first().click();
  await page.waitForTimeout(1500);
  await page.locator('input[placeholder*="Search" i]').first().fill('Echo Industries').catch(()=>{});
  await page.waitForTimeout(1000);
  const delRows = await page.getByRole('row').allInnerTexts();
  console.log('ECHO INDUSTRIES ROW:', JSON.stringify(delRows.slice(0,5)));
  await browser.close();
})();
