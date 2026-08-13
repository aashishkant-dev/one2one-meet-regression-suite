require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
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

  // Alex - find an open slot targeting QA Automation, and check own auto-accept toggle location
  const alex = await browser.newPage();
  await alex.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await alex.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await alex.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await alex.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(alex);
  await alex.waitForTimeout(2000);
  await alex.locator('a:has-text("Meetings")').first().click();
  await alex.waitForTimeout(1500);
  // find an "Available" slot label near current viewport
  const availableCount = await alex.getByText('Available', { exact: true }).count();
  console.log('Alex: "Available" slot labels visible:', availableCount);
  await alex.screenshot({ path: OUT + '/27-alex-meetings.png', fullPage: true });

  // Blake side
  const blake = await browser.newPage();
  await blake.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await blake.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_B_USERNAME);
  await blake.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_B_PASSWORD);
  await blake.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(blake);
  await blake.waitForTimeout(2000);
  await blake.locator('a:has-text("Meetings")').first().click();
  await blake.waitForTimeout(1500);
  const availableCountB = await blake.getByText('Available', { exact: true }).count();
  console.log('Blake: "Available" slot labels visible:', availableCountB);
  await blake.screenshot({ path: OUT + '/27-blake-meetings.png', fullPage: true });

  await browser.close();
})();
