import { test, expect } from '../support/fixtures/test-base';
import { DelegateMeetingReportPage } from '../support/pages/DelegateMeetingReportPage';

/**
 * Gap-fill for delegate-side "Meeting Reports" - had zero coverage in the merged register
 * (the Reports sheet there is organizer-only). Reached via a button on the Meetings page,
 * not a separate sidebar item - confirmed live 2026-08-12.
 */
test.describe('Delegate Meeting Reports', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Delegate Meeting Reports' });
  });

  test('TC-DRPT-001 delegate can open Meeting Reports from the Meetings page', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const report = new DelegateMeetingReportPage(bookingDelegateAPage);
    await report.gotoFromMeetingsPage();
    await expect(bookingDelegateAPage.getByText('Meeting Reports', { exact: true }).first()).toBeVisible();
  });

  test('TC-DRPT-002 report lists one row per scheduled meeting with partner and date/time', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const report = new DelegateMeetingReportPage(bookingDelegateAPage);
    await report.gotoFromMeetingsPage();
    // Alex (Booking Delta Co) has confirmed meetings with Blake Echo seeded on this event.
    await expect(bookingDelegateAPage.getByText('Blake Echo').first()).toBeVisible();
    const rowCount = await report.rows().count();
    expect(rowCount).toBeGreaterThan(1); // header row + at least one data row
  });

  test('TC-DRPT-003 Export All Meetings action is present and triggers a download', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const report = new DelegateMeetingReportPage(bookingDelegateAPage);
    await report.gotoFromMeetingsPage();
    const [download] = await Promise.all([
      bookingDelegateAPage.waitForEvent('download', { timeout: 15_000 }),
      report.exportAllButton().click(),
    ]);
    expect(download.suggestedFilename()).toBeTruthy();
  });
});
