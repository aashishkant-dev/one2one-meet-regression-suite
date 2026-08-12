require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
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
  const reqs = [];
  org.on('request', (r) => { if (/search/i.test(r.url())) reqs.push({ url: r.url(), method: r.method() }); });
  const resps = [];
  org.on('response', (r) => { if (/search/i.test(r.url())) resps.push({ url: r.url(), status: r.status() }); });

  await org.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await org.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await org.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await org.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(org);
  await org.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });

  console.log('requests containing "search" BEFORE typing:', JSON.stringify(reqs, null, 2));
  reqs.length = 0; resps.length = 0;

  const search = org.locator('input[type="search"]');
  await search.click();
  await search.fill('Booking Test Event');
  await org.waitForTimeout(1000);
  await search.press('Enter');
  await org.waitForTimeout(2000);

  console.log('requests containing "search" AFTER typing+enter:', JSON.stringify(reqs, null, 2));
  console.log('responses containing "search":', JSON.stringify(resps, null, 2));

  await browser.close();
})();
