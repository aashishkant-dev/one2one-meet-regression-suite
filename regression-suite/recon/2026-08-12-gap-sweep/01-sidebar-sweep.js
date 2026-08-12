require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('playwright-core');
const fs = require('fs');
const OUT = __dirname + '/out';
const BASE = process.env.O2O_STAGING_BASE_URL;

(async () => {
  const browser = await chromium.launch();

  // --- Organizer side: sidebar links + header search probe ---
  const orgPage = await browser.newPage();
  await orgPage.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await orgPage.locator('#username').fill(process.env.O2O_ORG_USERNAME);
  await orgPage.locator('#password').fill(process.env.O2O_ORG_PASSWORD);
  await orgPage.locator('button[type="submit"]').click();
  await orgPage.waitForTimeout(4000);

  const orgSidebarLinks = await orgPage.locator('a').evaluateAll(els =>
    els.map(e => ({ text: e.textContent.trim(), href: e.getAttribute('href') })).filter(x => x.text)
  );
  const orgHeaderInputs = await orgPage.locator('header input, [role="banner"] input, input[type="search"]').evaluateAll(els =>
    els.map(e => ({ tag: e.tagName, type: e.getAttribute('type'), placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), name: e.getAttribute('name'), id: e.id }))
  );
  const allInputsWithSearchHint = await orgPage.locator('input').evaluateAll(els =>
    els.map(e => ({ placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), type: e.getAttribute('type'), id: e.id }))
    .filter(x => (x.placeholder && /search/i.test(x.placeholder)) || (x.aria && /search/i.test(x.aria)))
  );

  fs.writeFileSync(OUT + '/organizer-sidebar-links.json', JSON.stringify(orgSidebarLinks, null, 2));
  fs.writeFileSync(OUT + '/organizer-header-inputs.json', JSON.stringify(orgHeaderInputs, null, 2));
  fs.writeFileSync(OUT + '/organizer-search-hint-inputs.json', JSON.stringify(allInputsWithSearchHint, null, 2));

  // --- Delegate side: sidebar links + search probes ---
  const delPage = await browser.newPage();
  await delPage.goto(BASE + '/delegate/' + process.env.O2O_BOOKING_EVENT_SLUG, { waitUntil: 'networkidle' });
  await delPage.locator('#username').fill(process.env.O2O_BOOKING_DELEGATE_A_USERNAME);
  await delPage.locator('#password').fill(process.env.O2O_BOOKING_DELEGATE_A_PASSWORD);
  await delPage.locator('button[type="submit"]').click();
  await delPage.waitForTimeout(4000);

  const delUrl = delPage.url();
  const delSidebarLinks = await delPage.locator('a').evaluateAll(els =>
    els.map(e => ({ text: e.textContent.trim(), href: e.getAttribute('href') })).filter(x => x.text)
  );
  const delSearchHintInputs = await delPage.locator('input').evaluateAll(els =>
    els.map(e => ({ placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), type: e.getAttribute('type'), id: e.id }))
    .filter(x => (x.placeholder && /search/i.test(x.placeholder)) || (x.aria && /search/i.test(x.aria)))
  );
  const delAllInputs = await delPage.locator('input').evaluateAll(els =>
    els.map(e => ({ placeholder: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), type: e.getAttribute('type'), id: e.id }))
  );

  fs.writeFileSync(OUT + '/delegate-landing-url.json', JSON.stringify({ url: delUrl }, null, 2));
  fs.writeFileSync(OUT + '/delegate-sidebar-links.json', JSON.stringify(delSidebarLinks, null, 2));
  fs.writeFileSync(OUT + '/delegate-search-hint-inputs.json', JSON.stringify(delSearchHintInputs, null, 2));
  fs.writeFileSync(OUT + '/delegate-all-inputs.json', JSON.stringify(delAllInputs, null, 2));

  console.log('DELEGATE URL:', delUrl);
  console.log('DELEGATE SIDEBAR:', JSON.stringify(delSidebarLinks, null, 2));
  console.log('ORG SEARCH HINT INPUTS:', JSON.stringify(allInputsWithSearchHint, null, 2));
  console.log('DEL SEARCH HINT INPUTS:', JSON.stringify(delSearchHintInputs, null, 2));

  await browser.close();
})();
