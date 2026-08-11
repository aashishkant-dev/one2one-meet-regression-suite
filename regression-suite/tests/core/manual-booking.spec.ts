import { test, expect } from '../support/fixtures/test-base';
import { ManualBookingPage } from '../support/pages/ManualBookingPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { seededData } from '../support/fixtures/seeded-data';

/** Smoke subset of the 7-case Manual Booking module. Confirmed 3/3 passing 2026-08-09. */
test.describe('Manual Booking', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Manual Booking' });
  });

  test('TC-MN-003 / TC-MN-N01 requesting delegate is excluded from the Target dropdown entirely', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Manual/i);

    const manual = new ManualBookingPage(organizerPage);
    await manual.goto();
    await manual.openAddForm();
    const requestingDelegate = seededData.bookingTestEvent.delegates[0];
    await manual.selectRequestingDelegate(requestingDelegate);
    const targetOptions = await manual.targetDropdownOptions();
    expect(targetOptions.join(' ')).not.toContain(requestingDelegate);
  });
});
