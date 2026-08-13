require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;
async function acceptTos(page, label) {
  await page.waitForTimeout(2500);
  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 10) {
    guard++;
    const buttons = await page.getByRole('button').allInnerTexts();
    console.log(label, 'iter', guard, 'url:', page.url(), 'buttons:', JSON.stringify(buttons));
    const cb = page.getByRole('checkbox');
    if (await cb.count()) await cb.first().check();
    const submitBtn = page.getByRole('button', { name: /^submit$/i });
    const continueBtn = page.getByRole('button', { name: /continue/i });
    if (await submitBtn.count()) {
      await submitBtn.click();
    } else if (await continueBtn.count()) {
      await continueBtn.click();
    } else {
      console.log(label, 'NO SUBMIT/CONTINUE BUTTON FOUND');
      break;
    }
    await page.waitForTimeout(1200);
  }
  console.log(label, 'final URL:', page.url());
}
(async () => {
  const browser = await chromium.launch();
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await pageA.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await pageA.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await pageA.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await pageA.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(pageA, 'A');

  await pageB.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await pageB.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await pageB.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await pageB.getByRole('button', { name: /log ?in/i }).click();
  await acceptTos(pageB, 'B');

  await pageB.screenshot({ path: OUT + '/32-pageB-final.png', fullPage: true });
  await browser.close();
})();
