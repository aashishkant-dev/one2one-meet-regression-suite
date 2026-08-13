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
  const text = await alex.locator('body').innerText();
  const lines = text.split('\n');
  const timeRe = /^\d{2}:\d{2}\s*(TO|-)\s*\d{2}:\d{2}$/;
  for (let i = 0; i < lines.length; i++) {
    if (timeRe.test(lines[i].trim())) {
      console.log(i, JSON.stringify(lines[i].trim()), '->', JSON.stringify(lines[i+1] ? lines[i+1].trim() : ''));
    }
  }
  await browser.close();
})();
