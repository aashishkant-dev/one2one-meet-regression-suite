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
  const alex = await browser.newPage();
  await alex.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await alex.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await alex.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await alex.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(alex);
  await alex.waitForTimeout(2000);
  await alex.locator('a:has-text("Agenda")').first().click();
  await alex.waitForTimeout(1500);
  const bodyText = await alex.locator('body').innerText();
  const availableCount = (bodyText.match(/Available/g) || []).length;
  console.log('Day 1 (06 SEP) - "Available" occurrences in agenda text:', availableCount);
  // switch to day 2
  await alex.getByText('07', {exact:true}).click().catch(()=>{});
  await alex.waitForTimeout(1000);
  const bodyText2 = await alex.locator('body').innerText();
  const availableCount2 = (bodyText2.match(/Available/g) || []).length;
  console.log('Day 2 (07 SEP) - "Available" occurrences in agenda text:', availableCount2);
  console.log('Total delegates in event (from earlier recon): 3 (Alex, Blake, QA Automation)');
  await browser.close();
})();
