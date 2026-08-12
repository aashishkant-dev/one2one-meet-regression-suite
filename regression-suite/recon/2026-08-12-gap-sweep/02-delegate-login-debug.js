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
  try {
    await page.waitForURL(/\/delegate\//, { timeout: 15000 });
  } catch (e) {
    console.log('URL wait failed:', e.message);
  }
  await page.waitForTimeout(2000);
  console.log('Final URL:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('BODY SNIPPET:', bodyText.slice(0, 800));
  await page.screenshot({ path: __dirname + '/out/delegate-login-debug.png', fullPage: true });
  await browser.close();
})();
