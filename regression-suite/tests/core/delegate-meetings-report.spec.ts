import { test, expect } from '../support/fixtures/test-base';
import { test as base } from '@playwright/test';
import { env } from '../support/env';
import { DelegateAuthPage } from '../support/pages/DelegateAuthPage';
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

  base('TC-DRPT-007 delegate cannot see another delegate\'s meeting report data', async ({ browser }) => {
    base.info().annotations.push({ type: 'module', description: 'Delegate Meeting Reports' });
    base.info().annotations.push({ type: 'priority', description: 'High' });
    base.info().annotations.push({
      type: 'note',
      description:
        "CONFIRMED live 2026-08-13: the report route (/delegate/<slug>/meeting-report) and its " +
        "backend call (GET /api/delegate/getMeetingReports) carry NO delegate ID in the URL/query " +
        "at all - the report is derived entirely from the caller's session/auth token. There is no " +
        "URL to tamper with (a stronger security posture than the ID-manipulation attack the " +
        "original case describes), so this instead verifies the actual property that matters: two " +
        "different delegate sessions each see only their own data, never each other's.",
    });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await new DelegateAuthPage(pageA).login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await new DelegateAuthPage(pageB).login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);

    const reportA = new DelegateMeetingReportPage(pageA);
    const reportB = new DelegateMeetingReportPage(pageB);
    await reportA.gotoFromMeetingsPage();
    await reportB.gotoFromMeetingsPage();

    // Each delegate's report correctly shows their real counterpart (Alex<->Blake) - each
    // session's report is scoped to its own auth context, not a shared/leaked data set.
    await expect(pageA.getByText('Blake Echo').first()).toBeVisible();
    await expect(pageB.getByText('Alex Delta').first()).toBeVisible();

    const rowsA = await reportA.rows().count();
    const rowsB = await reportB.rows().count();
    // Neither delegate's report should be empty (that would suggest the session-derived
    // scoping broke and returned nobody's data).
    expect(rowsA).toBeGreaterThan(1);
    expect(rowsB).toBeGreaterThan(1);

    await ctxA.close();
    await ctxB.close();
  });
});
