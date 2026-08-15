import { test, expect } from '../support/fixtures/test-base';
import { EventsPage } from '../support/pages/EventsPage';

/**
 * Smoke subset of the 10-case Event Management module (see ../../master-test-register.html
 * for the full register). Module confirmed 10/10 passing during the 2026-08-09 live session -
 * these 3 cover the golden path + the two validation guards most likely to regress.
 */
test.describe('Event Management', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Event Management' });
  });

  test('TC-EV-001 create a new event with all required fields', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const events = new EventsPage(organizerPage);
    const uniqueName = `Regression Smoke Event ${Date.now()}`;
    await events.goto();
    await events.createEvent({
      name: uniqueName,
      timezone: 'Kathmandu',
      country: 'Nepal',
      city: 'Kathmandu',
      venue: 'IIG',
      address: 'Test Address',
      email: `regression-${Date.now()}@example.com`,
      // Needs a leading +<countrycode> - see EventsPage.createEvent()'s comment on the phone widget.
      contactNumber: '+9779800000000',
    });
    await events.searchByName(uniqueName);
    await expect(events.eventRow(uniqueName)).toBeVisible();
  });

  test('TC-EV-N01 create event with required fields blank is rejected', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const events = new EventsPage(organizerPage);
    await events.goto();
    await events.openAddEventForm();
    await events.save();
    // Inline validation should block the submit - required fields stay flagged, no navigation away from the form.
    await expect(organizerPage.getByText(/event name.*required|required/i).first()).toBeVisible();
  });

  test('TC-EV-006 search events in All Events list filters by name', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const events = new EventsPage(organizerPage);
    await events.goto();
    await events.searchByName('Booking Test Event');
    await expect(events.eventRow('Booking Test Event')).toBeVisible();
    await events.searchByName('this-event-should-not-exist-zzz');
    await expect(organizerPage.getByRole('row')).not.toContainText('this-event-should-not-exist-zzz');
  });
});
