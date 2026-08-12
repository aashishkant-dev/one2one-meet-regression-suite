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

  // --- Organizer: probe the dashboard "Search..." input ---
  const org = await browser.newPage();
  await org.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await org.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await org.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await org.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(org);
  await org.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 });

  const searchInput = org.locator('input[type="search"]');
  console.log('search input count on dashboard:', await searchInput.count());
  await searchInput.click();
  await searchInput.fill('Booking');
  await org.waitForTimeout(1500);
  console.log('URL after typing "Booking":', org.url());
  const bodyAfterSearch = await org.locator('body').innerText();
  console.log('BODY SNIPPET after search:', bodyAfterSearch.slice(0, 500).replace(/\n+/g, ' | '));
  await org.screenshot({ path: OUT + '/org-search-typed.png', fullPage: true });

  // does it filter the Events list? try navigating to Events page and check for the same input
  await org.goto(BASE + '/organizer/events');
  await org.waitForTimeout(1500);
  const eventsSearchCount = await org.locator('input[type="search"], input[placeholder*="Search" i]').count();
  console.log('search input count on Events page:', eventsSearchCount);
  await org.screenshot({ path: OUT + '/org-events-page.png', fullPage: true });

  // --- Organizer: EO-Delegate toggle end to end on Booking Test Event ---
  await org.goto(BASE + '/organizer/dashboard');
  await org.waitForTimeout(1000);
  await org.locator('header').getByRole('button').first().click();
  await org.getByText('Booking Test Event', { exact: true }).first().click();
  await org.waitForTimeout(2500);
  const toggle = org.getByRole('button', { name: 'Set delegate active' });
  await toggle.click();
  await org.waitForTimeout(2500);
  console.log('URL after toggling delegate mode:', org.url());
  await org.screenshot({ path: OUT + '/org-after-toggle.png', fullPage: true });
  const toggledBody = await org.locator('body').innerText();
  console.log('BODY after toggle:', toggledBody.slice(0, 400).replace(/\n+/g, ' | '));

  // --- Delegate: Meeting Reports button + Delegates search behavior ---
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(del);
  await del.waitForURL(/\/delegate\//, { timeout: 15000 });
  await del.waitForTimeout(1500);

  await del.locator('a, button').filter({ hasText: /^Meetings$/ }).first().click();
  await del.waitForTimeout(1500);
  await del.getByText('Meeting Reports', { exact: true }).click();
  await del.waitForTimeout(2000);
  console.log('URL after clicking Meeting Reports:', del.url());
  const reportBody = await del.locator('body').innerText();
  console.log('REPORT BODY:', reportBody.slice(0, 800).replace(/\n+/g, ' | '));
  await del.screenshot({ path: OUT + '/del-meeting-reports.png', fullPage: true });

  // Delegates search behaviour
  await del.locator('a, button').filter({ hasText: /^Delegates$/ }).first().click();
  await del.waitForTimeout(1500);
  const before = await del.getByRole('row').count();
  await del.getByPlaceholder('Name, company, email...').fill('Blake');
  await del.waitForTimeout(1500);
  const after = await del.getByRole('row').count();
  console.log('Delegate directory rows before/after search "Blake":', before, after);
  await del.screenshot({ path: OUT + '/del-directory-search.png', fullPage: true });
  await del.getByPlaceholder('Name, company, email...').fill('zzzznomatch');
  await del.waitForTimeout(1500);
  const noMatchText = await del.locator('body').innerText();
  console.log('No-match search body snippet:', noMatchText.slice(noMatchText.indexOf('Delegates'), noMatchText.indexOf('Delegates') + 400).replace(/\n+/g, ' | '));

  await browser.close();
})();
