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

  // Delegate dashboard root - any input at all?
  const del = await browser.newPage();
  await del.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await del.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await del.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await del.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(del);
  await del.waitForTimeout(3000);
  const dashInputs = await del.locator('input').count();
  console.log('Delegate DASHBOARD input count:', dashInputs);

  // Meetings page - full text + any tab/filter controls
  await del.locator('a, button').filter({ hasText: /^Meetings$/ }).first().click();
  await del.waitForTimeout(1500);
  const meetingsFullText = await del.locator('body').innerText();
  console.log('MEETINGS FULL TEXT:\n', meetingsFullText.slice(0, 2500));
  const meetingsButtons = await del.getByRole('button').allInnerTexts();
  console.log('MEETINGS BUTTONS:', JSON.stringify(meetingsButtons));

  // Feedback page (organizer side) - can organizer reply?
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
  await org.locator('a:has-text("Feedback")').first().click();
  await org.waitForTimeout(1500);
  console.log('ORG FEEDBACK URL:', org.url());
  const orgFeedbackText = await org.locator('body').innerText();
  console.log('ORG FEEDBACK TEXT:', orgFeedbackText.slice(0, 1200));
  const orgFeedbackButtons = await org.getByRole('button').allInnerTexts();
  console.log('ORG FEEDBACK BUTTONS:', JSON.stringify(orgFeedbackButtons));

  await browser.close();
})();
