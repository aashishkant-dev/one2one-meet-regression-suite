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
  await page.waitForTimeout(3000);

  let guard = 0;
  while (page.url().includes('/auth/terms-of-service') && guard < 8) {
    guard++;
    const cb = page.getByRole('checkbox');
    if (await cb.count()) {
      await cb.first().check();
    }
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(1500);
    console.log('step', guard, '->', page.url());
  }
  console.log('Final URL:', page.url());
  await page.screenshot({ path: __dirname + '/out/after-tos.png', fullPage: true });
  await browser.close();
})();
