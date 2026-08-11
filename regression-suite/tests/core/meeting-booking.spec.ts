import { test, expect } from '../support/fixtures/test-base';
import { DelegateMeetingsPage } from '../support/pages/DelegateMeetingsPage';
import { seededData } from '../support/fixtures/seeded-data';

/**
 * Smoke subset of the core Meeting Booking & Requests module - the actual booking
 * click-through, not just CRUD/config. Requires the Booking Test Event fixture
 * (id 362, booking window open 03 Aug-05 Sep 2026) - see README "Fixtures" for how
 * to rebuild it if O2O_BOOKING_DELEGATE_*_PASSWORD in .env is empty/stale.
 */
test.describe('Meeting Booking & Requests', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Meeting Booking & Requests' });
  });

  test('TC-MB-002 delegate sends a meeting request for an open slot', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const meetings = new DelegateMeetingsPage(bookingDelegateAPage);
    await meetings.goto();

    const slotLabel = bookingDelegateAPage.getByText(/^\d{2}:\d{2} TO \d{2}:\d{2}$/).first();
    const timeText = (await slotLabel.textContent())!.trim();
    await meetings.openBookMeetingModal(timeText);
    const response = await meetings.submitBookMeeting({ meetingWith: seededData.bookingTestEvent.delegates[1] });
    expect(response.status()).toBe(200);
  });

  test('TC-MB-014 / TC-MB-N03 double-booking the same slot is prevented after a request is sent', async ({ bookingDelegateAPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const meetings = new DelegateMeetingsPage(bookingDelegateAPage);
    await meetings.goto();

    const slotLabel = bookingDelegateAPage.getByText(/^\d{2}:\d{2} TO \d{2}:\d{2}$/).nth(1);
    const timeText = (await slotLabel.textContent())!.trim();
    await meetings.openBookMeetingModal(timeText);
    await meetings.submitBookMeeting({ meetingWith: seededData.bookingTestEvent.delegates[1] });

    // Reopening the same slot must not show a Book button at all - the guard fires before
    // the modal can even open again, not just at submit time.
    await meetings.expandSlot(timeText);
    await expect(meetings.bookButtonForSlot(timeText)).toHaveCount(0);
  });

  test.skip('TC-MB-N01 booking before window opens - no "before window" state reachable on current fixture', async () => {
    // Booking Test Event's window opens 2026-08-03; if this fixture's dates are ever moved
    // forward again, build a second event with a not-yet-open window instead of faking this.
  });
});
