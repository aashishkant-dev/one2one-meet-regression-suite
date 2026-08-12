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
  await org.waitForURL(/\/delegate\//, { timeout: 15000 });
  await org.waitForTimeout(1500);

  const allButtons = await org.locator('header button, header [role="switch"]').evaluateAll(els =>
    els.map(e => ({ tag: e.tagName, role: e.getAttribute('role'), aria: e.getAttribute('aria-label'), ariaChecked: e.getAttribute('aria-checked'), text: e.textContent.trim().slice(0,30) }))
  );
  console.log('header interactive elements:', JSON.stringify(allButtons, null, 2));

  // try clicking the switch back
  const sw = org.locator('header [role="switch"], header button[aria-checked]').first();
  console.log('switch count:', await sw.count());
  if (await sw.count()) {
    await sw.click();
    await org.waitForTimeout(2500);
    console.log('URL after toggle back:', org.url());
  }
  // also try trying to access an organizer-only URL while in delegate mode (before toggling back) - do this in a fresh nav
  await browser.close();
})();
