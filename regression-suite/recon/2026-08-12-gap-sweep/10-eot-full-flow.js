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
  const org = await browser.newPage();
  await org.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await org.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await org.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await org.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(org);
  await org.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });

  await org.locator('header').getByRole('button').first().click();
  await org.getByText('Booking Test Event', { exact: true }).first().click();
  await org.waitForTimeout(2500);

  await org.getByRole('button', { name: 'Set delegate active' }).click();
  await org.waitForTimeout(1500);

  const modal = org.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: 'Create Delegate Account' });
  console.log('modal visible:', await modal.isVisible().catch(() => false));

  await modal.getByText(/^access type/i).first().locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
  await org.waitForTimeout(500);
  const options = await org.getByRole('option').allInnerTexts();
  console.log('Access type options:', options);
  if (options.length) {
    await org.getByRole('option', { name: options[0], exact: true }).click();
  }
  await org.screenshot({ path: OUT + '/eot-modal-filled.png', fullPage: true });

  const submitBtn = modal.getByRole('button', { name: /create|save|submit|continue/i }).last();
  console.log('submit btn count:', await submitBtn.count());
  await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
  await org.screenshot({ path: OUT + '/eot-modal-before-submit.png', fullPage: true });
  await submitBtn.click({ timeout: 5000 }).catch(async (e) => {
    console.log('submit click failed:', e.message);
  });
  await org.waitForTimeout(3000);
  console.log('URL after submit:', org.url());
  const bodyAfter = await org.locator('body').innerText();
  console.log('BODY after submit:', bodyAfter.slice(0, 500).replace(/\n+/g, ' | '));
  await org.screenshot({ path: OUT + '/eot-after-submit.png', fullPage: true });

  await browser.close();
})();
