require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;
(async () => {
  const browser = await chromium.launch();
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_B_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_B_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await del.waitForTimeout(4000);
  console.log('URL:', del.url());
  console.log('BODY:', (await del.locator('body').innerText()).slice(0, 600));
  await del.screenshot({ path: OUT + '/blake-debug.png', fullPage: true });
  await browser.close();
})();
