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
  org.on('crash', () => console.log('PAGE CRASHED'));
  org.on('pageerror', (e) => console.log('PAGE ERROR', e.message));

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
  const dialog = org.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: 'Create Delegate Account' });
  console.log('modal visible:', await dialog.isVisible().catch(() => false));

  const dialogButtons = await dialog.getByRole('button').allInnerTexts();
  console.log('dialog buttons:', dialogButtons);

  await dialog.getByText(/^access type/i).first().locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
  await org.waitForTimeout(500);
  await org.getByRole('option', { name: /shared access|individual access/i }).first().click();
  await org.waitForTimeout(500);
  console.log('access type set, taking screenshot');
  await org.screenshot({ path: OUT + '/eot-clean-filled.png', fullPage: true });

  const submitBtn = dialog.getByRole('button', { name: dialogButtons[dialogButtons.length - 1] });
  console.log('clicking button:', dialogButtons[dialogButtons.length - 1]);
  await submitBtn.click();
  await org.waitForTimeout(3000);
  console.log('URL after submit:', org.url());
  await org.screenshot({ path: OUT + '/eot-clean-after.png', fullPage: true }).catch(e => console.log('screenshot failed', e.message));
  const bodyAfter = await org.locator('body').innerText().catch(() => 'BODY READ FAILED');
  console.log('BODY after submit:', bodyAfter.slice(0, 500).replace(/\n+/g, ' | '));

  await browser.close();
})();
