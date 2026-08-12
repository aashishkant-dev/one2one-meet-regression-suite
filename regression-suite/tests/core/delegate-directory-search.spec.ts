import { test, expect } from '../support/fixtures/test-base';
import { DelegateDirectoryPage } from '../support/pages/DelegateDirectoryPage';

/**
 * Gap-fill for the delegate-side "Delegates" directory search bar - the merged register only
 * had one high-level case (TC-DL-007) and never exercised the search box's own mechanics.
 * Added + executed live on staging 2026-08-12 as bookingDelegateAPage (Alex).
 */
test.describe('Delegate Directory Search', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Delegate Directory Search' });
  });

  test('TC-DDIR-001 typing alone does not live-filter; requires Apply Filters', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'observed-behavior',
      description: 'CONFIRMED LIVE 2026-08-12: search box does not fire a request on keystroke alone (documenting reality, not the live-filter UX originally assumed).',
    });
    const dir = new DelegateDirectoryPage(bookingDelegateAPage);
    await dir.goto();
    const beforeCount = await dir.rows().count();
    await dir.searchInput().fill('zzzznomatch');
    await bookingDelegateAPage.waitForTimeout(1500);
    const afterTypingCount = await dir.rows().count();
    expect(afterTypingCount).toBe(beforeCount);
  });

  test('TC-DDIR-003 Apply Filters with no match shows an explicit empty state', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const dir = new DelegateDirectoryPage(bookingDelegateAPage);
    await dir.goto();
    await dir.searchAndApply('zzzznomatch-does-not-exist');
    await expect(dir.emptyState()).toBeVisible();
  });

  test('TC-DDIR-004 Reset restores the full delegate list after a filtered search', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Low' });
    const dir = new DelegateDirectoryPage(bookingDelegateAPage);
    await dir.goto();
    const fullCount = await dir.rows().count();
    await dir.searchAndApply('zzzznomatch-does-not-exist');
    await expect(dir.emptyState()).toBeVisible();
    await dir.resetFilters();
    await expect(dir.rows()).toHaveCount(fullCount, { timeout: 10_000 });
  });

  test('TC-DDIR-005 Apply Filters with a valid partial name returns the matching delegate', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const dir = new DelegateDirectoryPage(bookingDelegateAPage);
    await dir.goto();
    // Alex's only counterpart delegate in Booking Test Event is Blake Echo / Booking Echo Co.
    await dir.searchAndApply('Blake');
    await expect(bookingDelegateAPage.getByText('Blake Echo').first()).toBeVisible();
    await expect(dir.emptyState()).not.toBeVisible();
  });
});
