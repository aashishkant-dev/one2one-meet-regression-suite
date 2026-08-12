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
  console.log('Before toggle URL:', org.url());

  await org.getByRole('button', { name: 'Set delegate active' }).click();
  await org.waitForTimeout(2500);
  console.log('After toggle URL:', org.url());
  const body = await org.locator('body').innerText();
  console.log('BODY:', body.slice(0, 500).replace(/\n+/g, ' | '));
  await org.screenshot({ path: OUT + '/eot-state-after-toggle.png', fullPage: true });

  // toggle again to see if it goes back
  const backToggle = org.getByRole('button', { name: /set delegate active|set organizer active|switch/i });
  console.log('toggle-back candidate count:', await backToggle.count());
  await browser.close();
})();
