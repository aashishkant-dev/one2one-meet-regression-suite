require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const path = require('path');
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
async function pickReactSelect(page, labelText, optionText) {
  await page.getByText(labelText).first().locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
  await page.locator('.react-select__option', { hasText: optionText }).first().click();
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
  await page.locator('a:has-text("Events")').first().click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /add new event/i }).click();
  await page.waitForTimeout(1000);

  const raceName = 'ValidateFlow-' + Date.now();
  await page.getByLabel(/^event name/i).fill(raceName);

  await page.getByPlaceholder(/eg: 2025/i).click();
  await page.waitForTimeout(500);
  const start = new Date(); start.setDate(start.getDate()+3);
  const end = new Date(start); end.setDate(end.getDate()+2);
  await page.getByText(String(start.getDate()), { exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByText(String(end.getDate()), { exact: true }).click();
  await page.waitForTimeout(300);

  await pickReactSelect(page, /venue timezone/i, 'Kathmandu');
  await page.getByLabel(/^venue \*?$/i).fill('Race Test Venue');
  await page.getByLabel(/venue address/i).fill('Race Test Address');
  await pickReactSelect(page, /venue country/i, 'Nepal');
  await page.waitForTimeout(500);
  await pickReactSelect(page, /venue city/i, 'Kathmandu');
  await page.getByLabel(/event email/i).fill('race-validate@example.com');
  const phoneInput = page.getByLabel(/event contact number/i); await phoneInput.click(); await phoneInput.fill(''); await phoneInput.pressSequentially('+9779800000000', { delay: 30 });
  await page.locator('#banner').setInputFiles(path.resolve(__dirname, 'test-banner.png'));

  await page.screenshot({ path: OUT + '/37-before-submit.png', fullPage: true });
  await page.getByRole('button', { name: /add new event/i }).click();
  await page.waitForTimeout(6000);
  console.log('URL after submit:', page.url());
  const bodyText = await page.locator('body').innerText();
  console.log('BODY SNIPPET:', bodyText.slice(0, 500));
  await page.screenshot({ path: OUT + '/37-after-submit.png', fullPage: true });
  await browser.close();
})();
