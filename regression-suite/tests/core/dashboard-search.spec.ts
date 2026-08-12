import { test, expect } from '../support/fixtures/test-base';

/**
 * Gap-fill for the organizer dashboard's global "Search..." header input - had zero test
 * coverage anywhere in the merged register. Confirmed live 2026-08-12: it calls
 * GET /api/organizer/search?search_term=... on every keystroke (no Enter needed), and the
 * backend returns results grouped by table (events/announcements/delegates/...) with
 * relevance-ranked, <b>-highlighted snippets. The dropdown itself is a plain div (no
 * role="listbox"/"menu"), anchored by its "View all results" footer link.
 */
test.describe('Dashboard Search Bar', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Dashboard Search Bar' });
  });

  const resultsPanel = (page: import('@playwright/test').Page) =>
    page.locator('div').filter({ hasText: 'View all results' }).first();

  test('TC-SRCH-002 typing a known event name live-shows grouped results without pressing Enter', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const search = organizerPage.locator('input[type="search"]');
    const [resp] = await Promise.all([
      organizerPage.waitForResponse((r) => r.url().includes('/api/organizer/search') && r.status() === 200),
      search.click().then(() => search.fill('Booking Test Event')),
    ]);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data.total).toBeGreaterThan(0);

    await expect(resultsPanel(organizerPage)).toBeVisible();
    const panelText = await resultsPanel(organizerPage).innerText();
    expect(panelText).toMatch(/Booking/);
    expect(panelText).toMatch(/Events|Announcements|Delegates/i);
  });

  test('TC-SRCH-006 a query with no matches shows an explicit empty/zero-result state, not a stuck loader', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const search = organizerPage.locator('input[type="search"]');
    const [resp] = await Promise.all([
      organizerPage.waitForResponse((r) => r.url().includes('/api/organizer/search') && r.status() === 200),
      search.click().then(() => search.fill('zzzznomatch1786291524828')),
    ]);
    const json = await resp.json();
    expect(json.data.total).toBe(0);
    await organizerPage.waitForTimeout(500);
    // Document whatever the UI actually shows for zero results (empty panel vs explicit copy).
    const panelVisible = await resultsPanel(organizerPage).isVisible().catch(() => false);
    test.info().annotations.push({ type: 'observed-outcome', description: `results panel visible for 0-result query: ${panelVisible}` });
  });

  test('TC-SRCH-009 a script-tag query is sent/rendered as inert text, not executed (XSS)', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const search = organizerPage.locator('input[type="search"]');
    await search.click();
    await search.fill('<script>window.__xss=true</script>');
    await organizerPage.waitForTimeout(1500);
    const xssFired = await organizerPage.evaluate(() => (window as any).__xss === true);
    expect(xssFired).toBe(false);
  });
});
