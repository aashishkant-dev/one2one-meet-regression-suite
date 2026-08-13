require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;
async function acceptTos(page) {
  await page.waitForTimeout(2500);
  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 8) {
    guard++;
    const cb = page.getByRole('checkbox');
    if (await cb.count()) await cb.first().check();
    const submitBtn = page.getByRole('button', { name: /^submit$/i });
    if (await submitBtn.count()) { await submitBtn.click(); await page.waitForTimeout(1200); continue; }
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(1200);
  }
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await page.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(page);
  await page.waitForTimeout(2000);
  await page.locator('header').getByRole('button').first().click();
  await page.getByText('Booking Test Event', { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Set delegate active' }).click();
  await page.waitForTimeout(1500);
  if (page.url().includes('terms-of-service')) await acceptTos(page);
  await page.waitForURL(/\/delegate\//, { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(1500);
  console.log('URL:', page.url());

  await page.locator('a:has-text("Meetings")').first().click();
  await page.waitForTimeout(1500);
  const text = await page.locator('body').innerText();
  console.log('MEETINGS TEXT SNIPPET:\n', text.slice(0, 2500));
  const acceptButtons = await page.getByRole('button', { name: /accept/i }).count();
  const rejectButtons = await page.getByRole('button', { name: /reject/i }).count();
  console.log('Accept buttons found:', acceptButtons, 'Reject buttons found:', rejectButtons);
  await page.screenshot({ path: OUT + '/33-qa-auto-meetings.png', fullPage: true });
  await browser.close();
})();
