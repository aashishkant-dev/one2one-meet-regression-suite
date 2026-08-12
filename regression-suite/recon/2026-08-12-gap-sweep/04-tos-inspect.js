require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const BASE = process.env.O2O_STAGING_BASE_URL;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await page.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await page.getByRole('button', { name: /log ?in/i }).click();
  await page.waitForTimeout(4000);
  console.log('URL after login:', page.url());
  const text = await page.locator('body').innerText();
  console.log('BODY:', text.slice(0, 1500));
  const buttons = await page.getByRole('button').allInnerTexts();
  console.log('BUTTONS:', buttons);
  const checkboxes = await page.getByRole('checkbox').count();
  console.log('CHECKBOXES:', checkboxes);
  await page.screenshot({ path: __dirname + '/out/tos-page.png', fullPage: true });
  await browser.close();
})();
