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

  // Organizer global search: click, type, press Enter
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
  await org.waitForTimeout(800);
  // look for any dropdown/listbox that appeared
  const listbox = org.locator('[role="listbox"], [role="menu"], ul li a, [class*="dropdown"], [class*="suggest"]');
  console.log('possible suggestion containers count:', await listbox.count());
  await org.screenshot({ path: OUT + '/org-search-live.png', fullPage: true });
  await search.press('Enter');
  await org.waitForTimeout(1500);
  console.log('URL after Enter:', org.url());
  await org.screenshot({ path: OUT + '/org-search-enter.png', fullPage: true });

  // Delegate directory - Apply Filters button behavior
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(del);
  await del.waitForURL(/\/delegate\//, { timeout: 15000 });
  await del.waitForTimeout(1500);
  await del.locator('a, button').filter({ hasText: /^Delegates$/ }).first().click();
  await del.waitForTimeout(1500);

  const [resp] = await Promise.all([
    del.waitForResponse(r => /delegate/i.test(r.url()) && r.request().method() === 'GET', { timeout: 8000 }).catch(() => null),
    del.getByPlaceholder('Name, company, email...').fill('zzzznomatch'),
  ]);
  console.log('response fired on typing alone?', !!resp, resp && resp.url());
  await del.waitForTimeout(1000);
  const bodyNoApply = await del.locator('body').innerText();
  console.log('rows text before Apply Filters:', bodyNoApply.slice(bodyNoApply.indexOf('S No.'), bodyNoApply.indexOf('S No.') + 300).replace(/\n+/g,' | '));

  const applyBtn = del.getByRole('button', { name: /apply filters/i });
  const [resp2] = await Promise.all([
    del.waitForResponse(r => /delegate/i.test(r.url()), { timeout: 8000 }).catch(() => null),
    applyBtn.click(),
  ]);
  await del.waitForTimeout(1500);
  const bodyAfterApply = await del.locator('body').innerText();
  console.log('rows text AFTER Apply Filters:', bodyAfterApply.slice(bodyAfterApply.indexOf('S No.'), bodyAfterApply.indexOf('S No.') + 300).replace(/\n+/g,' | '));
  await del.screenshot({ path: OUT + '/del-search-after-apply.png', fullPage: true });

  await browser.close();
})();
