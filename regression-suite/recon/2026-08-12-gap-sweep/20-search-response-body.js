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

  const search = org.locator('input[type="search"]');
  await search.click();
  await search.fill('Booking Test Event');
  const [resp] = await Promise.all([
    org.waitForResponse(r => r.url().includes('/api/organizer/search')),
    search.press('Enter'),
  ]);
  console.log('status:', resp.status());
  const body = await resp.text();
  console.log('BODY:', body.slice(0, 1000));
  await org.waitForTimeout(1000);
  await org.screenshot({ path: OUT + '/search-after-response.png', fullPage: true });

  // does typing alone (no Enter) also fire it, live-as-you-type?
  await search.fill('');
  await org.waitForTimeout(300);
  let liveReq = false;
  org.on('request', r => { if (r.url().includes('/api/organizer/search')) liveReq = true; });
  await search.type('Delta', { delay: 150 });
  await org.waitForTimeout(1500);
  console.log('live request fired while typing (no Enter):', liveReq);

  await browser.close();
})();
