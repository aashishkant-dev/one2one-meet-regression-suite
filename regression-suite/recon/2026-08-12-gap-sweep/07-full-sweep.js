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
    els.map(e => ({ placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), type: e.getAttribute('type'), id: e.id, name: e.getAttribute('name') }))
  );
}
async function dumpLinks(page) {
  return page.locator('a').evaluateAll(els =>
    els.map(e => ({ text: e.textContent.trim(), href: e.getAttribute('href') })).filter(x => x.text)
  );
}

(async () => {
  const browser = await chromium.launch();

  // ---------------- ORGANIZER ----------------
  const org = await browser.newPage();
  await org.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await org.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await org.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await org.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(org);
  await org.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });

  fs.writeFileSync(OUT + '/org-dashboard-links.json', JSON.stringify(await dumpLinks(org), null, 2));
  fs.writeFileSync(OUT + '/org-dashboard-inputs.json', JSON.stringify(await dumpInputs(org), null, 2));
  await org.screenshot({ path: OUT + '/org-dashboard.png', fullPage: true });

  // switch to booking test event, check toggle
  await org.locator('header').getByRole('button').first().click();
  await org.getByText('Booking Test Event', { exact: true }).first().click();
  await org.waitForTimeout(2500);
  const toggleBtn = org.getByRole('button', { name: 'Set delegate active' });
  console.log('Toggle button count on Booking Test Event:', await toggleBtn.count());
  await org.screenshot({ path: OUT + '/org-booking-event.png', fullPage: true });

  // ---------------- DELEGATE ----------------
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(del);
  await del.waitForURL(/\/delegate\//, { timeout: 15000 });
  await del.waitForTimeout(1500);

  console.log('Delegate landing URL:', del.url());
  fs.writeFileSync(OUT + '/del-dashboard-links.json', JSON.stringify(await dumpLinks(del), null, 2));
  fs.writeFileSync(OUT + '/del-dashboard-inputs.json', JSON.stringify(await dumpInputs(del), null, 2));
  await del.screenshot({ path: OUT + '/del-dashboard.png', fullPage: true });

  const sidebarTexts = await del.locator('a, button').allInnerTexts();
  fs.writeFileSync(OUT + '/del-sidebar-all-clickables.json', JSON.stringify(sidebarTexts, null, 2));

  await browser.close();
})();
