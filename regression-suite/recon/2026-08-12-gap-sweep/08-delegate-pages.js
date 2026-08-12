require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const fs = require('fs');
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
async function dumpInputs(page) {
  return page.locator('input').evaluateAll(els =>
    els.map(e => ({ placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), type: e.getAttribute('type'), id: e.id }))
  );
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await page.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(page);
  await page.waitForURL(/\/delegate\//, { timeout: 15000 });
  await page.waitForTimeout(1500);

  const pages = ['Meetings', 'Delegates', 'Feedbacks', 'My Profile', 'Agenda'];
  for (const label of pages) {
    await page.locator('a, button').filter({ hasText: new RegExp(`^${label}$`) }).first().click();
    await page.waitForTimeout(2000);
    const url = page.url();
    const text = (await page.locator('body').innerText()).slice(0, 700);
    const inputs = await dumpInputs(page);
    const tabs = await page.getByRole('tab').allInnerTexts().catch(() => []);
    const buttons = await page.getByRole('button').allInnerTexts();
    console.log(`\n===== ${label} (${url}) =====`);
    console.log('TEXT:', text.replace(/\n+/g, ' | '));
    console.log('INPUTS:', JSON.stringify(inputs));
    console.log('TABS:', JSON.stringify(tabs));
    console.log('BUTTONS:', JSON.stringify(buttons.slice(0, 20)));
    await page.screenshot({ path: `${OUT}/del-${label.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });
  }

  await browser.close();
})();
