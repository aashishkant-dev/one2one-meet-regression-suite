require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
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
  await page.waitForTimeout(1500);

  // find an open slot and click it then Block
  await page.getByText('16:00 TO 16:15').first().click();
  await page.waitForTimeout(500);
  const blockBtn = page.getByText('16:00 TO 16:15').first().locator('xpath=ancestor::*[.//button[contains(text(),"Block")] or .//button[@title="Block"]][1]').getByRole('button', { name: /block/i });
  console.log('block button count:', await blockBtn.count());
  await blockBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/41-after-block-click.png', fullPage: true });
  const bodyText = await page.locator('body').innerText();
  console.log('BODY SNIPPET:', bodyText.slice(bodyText.indexOf('16:00'), bodyText.indexOf('16:00')+200));
  await browser.close();
})();
