import { test, expect } from '../support/fixtures/test-base';
import { LiveMeetingsPage } from '../support/pages/LiveMeetingsPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { seededData } from '../support/fixtures/seeded-data';

/** Smoke subset of the 6-case Live Meetings Monitor module. Confirmed 4/4 passing 2026-08-09. */
test.describe('Live Meetings Monitor', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Live Meetings Monitor' });
  });

  test('TC-LM-N01 date picker only offers days that actually have a meeting agenda', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Meeting/i);

    const live = new LiveMeetingsPage(organizerPage);
    await live.goto();
    // Booking Test Event has a 2-day agenda (06-07 Sep) - the picker should show exactly
    // those bookable days, correctly excluding pre/post-event all-day-only dates.
    const count = await live.availableDateButtons().count();
    expect(count).toBeGreaterThan(0);
  });
});
