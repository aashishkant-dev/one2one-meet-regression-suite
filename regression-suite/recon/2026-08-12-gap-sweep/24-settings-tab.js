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
  await org.waitForTimeout(2000);

  await org.goto(BASE + '/organizer/settings');
  await org.waitForTimeout(1500);
  // click the in-page "Settings" tab (3rd tab: My Profile / Company Details / Contact Person / Settings)
  await org.getByRole('tab', { name: 'Settings' }).or(org.getByText('Settings', {exact:true}).last()).click();
  await org.waitForTimeout(1500);
  console.log('URL:', org.url());
  const text = await org.locator('body').innerText();
  console.log('TEXT:\n', text.slice(0, 3000));
  const labels = await org.locator('label').allInnerTexts();
  console.log('LABELS:', JSON.stringify(labels));
  await org.screenshot({ path: OUT + '/org-settings-tab.png', fullPage: true });
  await browser.close();
})();
