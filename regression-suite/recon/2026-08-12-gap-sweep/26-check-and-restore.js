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
  const page = await browser.newPage();
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await page.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(page);
  await page.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });
  await page.locator('header').getByRole('button').first().click();
  await page.getByText('Booking Test Event', { exact: true }).first().click();
  await page.waitForTimeout(2500);
  await page.goto(BASE + '/organizer/settings');
  await page.waitForTimeout(3000);

  const companyDesc = await page.locator('textarea').first().inputValue().catch(()=>'ERR');
  console.log('Company Description value:', JSON.stringify(companyDesc));
  const allTextInputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').evaluateAll(els => els.map(e => ({id: e.id, value: e.value})));
  console.log('text inputs:', JSON.stringify(allTextInputs));

  await page.screenshot({ path: OUT + '/26-current-state.png', fullPage: true });

  // Try restoring Accept/Reject field to 24
  const field = page.getByText('Accept/Reject automatically requests after:', { exact: false }).locator('xpath=following::input[@type="number"][1]');
  await field.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, '24');
  await field.press('Tab');
  await page.waitForTimeout(1000);

  const saveBtn = page.getByRole('button', { name: 'Update Profile' });
  const isEnabled = await saveBtn.isEnabled();
  console.log('Save button enabled after restoring to 24:', isEnabled);
  await page.screenshot({ path: OUT + '/26-after-restore-attempt.png', fullPage: true });

  if (isEnabled) {
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('Clicked save. Body snippet:', (await page.locator('body').innerText()).slice(0, 300));
  }

  await browser.close();
})();
