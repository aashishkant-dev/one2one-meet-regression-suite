require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;
(async () => {
  const browser = await chromium.launch();
  const alex = await browser.newPage();
  await alex.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await alex.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await alex.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await alex.getByRole('button', { name: /log ?in/i }).click();
  await alex.waitForTimeout(4000);
  console.log('URL:', alex.url());
  if (alex.url().includes('terms-of-service')) {
    console.log('ON TOS PAGE');
    const buttons = await alex.getByRole('button').allInnerTexts();
    console.log('buttons:', buttons);
    await alex.screenshot({ path: OUT + '/29-delegate-tos.png', fullPage: true });
  } else {
    await alex.locator('a:has-text("Agenda")').first().click();
    await alex.waitForTimeout(1500);
    const bodyText = await alex.locator('body').innerText();
    const availableCount = (bodyText.match(/Available/g) || []).length;
    console.log('Day 1 - Available count:', availableCount);
    await alex.screenshot({ path: OUT + '/29-alex-agenda.png', fullPage: true });
  }
  await browser.close();
})();
