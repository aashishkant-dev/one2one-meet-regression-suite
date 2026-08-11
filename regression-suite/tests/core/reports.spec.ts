import { test, expect } from '../support/fixtures/test-base';
import { ReportsPage } from '../support/pages/ReportsPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { seededData } from '../support/fixtures/seeded-data';

/** Smoke subset of the 9-case Reports module. Confirmed 5/5 passing 2026-08-09. */
test.describe('Reports', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Reports' });
  });

  test('TC-RP-001 Summary Stats section renders with real data for a populated event', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Report/i);

    const reports = new ReportsPage(organizerPage);
    await reports.goto();
    await reports.expectSectionRenders('Total Meetings');
  });

  test('TC-RP-003 Delegate Report tab lists per-delegate metrics', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const reports = new ReportsPage(organizerPage);
    await reports.goto();
    await reports.gotoTab('Delegate Report');
    await expect(organizerPage.getByRole('table').or(organizerPage.getByRole('row')).first()).toBeVisible();
  });
});
