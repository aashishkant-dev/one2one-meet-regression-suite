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
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_B_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_B_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(del);
  await del.waitForURL(/\/delegate\//, { timeout: 15000 });
  await del.waitForTimeout(1500);
  await del.locator('a, button').filter({ hasText: /^Feedbacks$/ }).first().click();
  await del.waitForTimeout(1500);
  await del.getByRole('button', { name: /submit feedback/i }).click();
  await del.waitForTimeout(1000);
  const dialog = del.locator('[role="dialog"], [role="alertdialog"]');
  console.log('dialog visible:', await dialog.isVisible().catch(() => false));
  const labels = await dialog.locator('label').allInnerTexts();
  console.log('labels:', labels);
  const inputs = await dialog.locator('input, textarea').evaluateAll(els =>
    els.map(e => ({ tag: e.tagName, placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), id: e.id }))
  );
  console.log('inputs:', JSON.stringify(inputs));
  const buttons = await dialog.getByRole('button').allInnerTexts();
  console.log('buttons:', buttons);
  await del.screenshot({ path: OUT + '/del-feedback-form.png', fullPage: true });
  await browser.close();
})();
