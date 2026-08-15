import { test, expect } from '../../../regression-suite/tests/support/fixtures/test-base';
import { EventsPage } from '../../../regression-suite/tests/support/pages/EventsPage';
import { DelegatesPage } from '../../../regression-suite/tests/support/pages/DelegatesPage';
import { AccessTypesPage } from '../../../regression-suite/tests/support/pages/AccessTypesPage';
import { OrganizerNav } from '../../../regression-suite/tests/support/pages/OrganizerNav';
import { seededData } from '../../../regression-suite/tests/support/fixtures/seeded-data';

/**
 * Core CRUD smoke checks - the golden paths most likely to break from a UI/copy change.
 * All three create fresh, timestamped data (never touches or depends on another test's
 * fixture state), so this file is safe to re-run after every deploy without any manual reset.
 */
test.describe('Smoke - Core CRUD', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Smoke - Core CRUD' });
  });

  test('TC-EV-001 create a new event with all required fields', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const events = new EventsPage(organizerPage);
    const uniqueName = `Smoke Event ${Date.now()}`;
    await events.goto();
    await events.createEvent({
      name: uniqueName,
      city: 'Kathmandu',
      venue: 'IIG',
      address: 'Test Address',
      timezone: 'Kathmandu',
      country: 'Nepal',
      email: `smoke-${Date.now()}@example.com`,
      // Needs a leading +<countrycode> - see EventsPage.createEvent()'s comment on the phone widget.
      contactNumber: '+9779800000000',
    });
    await events.searchByName(uniqueName);
    await expect(events.eventRow(uniqueName)).toBeVisible();
  });

  test('TC-DM-001 add delegate with primary participant lands inactive by default', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.currentEvent.name, /Delegate/i);

    const delegates = new DelegatesPage(organizerPage);
    const companyName = `Smoke Test Co ${Date.now()}`;
    await delegates.goto();
    await delegates.createDelegate({
      companyName,
      companyEmail: `smoke-${Date.now()}@example.com`,
      // Confirmed live 2026-08-15: seeded option is "Individual Access", not bare "Individual".
      accessType: 'Individual Access',
      country: 'Nepal',
      city: 'Kathmandu',
      contactNumber: '+9779800000000',
      companyDescription: 'Automation smoke fixture',
      participantSalutation: 'Mr',
      participantFirstName: 'Smoke',
      participantLastName: 'Test',
      participantEmail: `smoke-participant-${Date.now()}@example.com`,
      participantContactNumber: '+9779800000001',
    });

    await expect(delegates.row(companyName)).toBeVisible();
    await expect(delegates.row(companyName).locator('[role="switch"], [aria-checked]').first())
      .toHaveAttribute('aria-checked', 'false');
  });

  test('TC-AT-001 Individual access type auto-fills Max Participants=1 and disables the field', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    // Pure form-state check - never clicks Save, so it leaves zero data behind.
    const accessTypes = new AccessTypesPage(organizerPage);
    await accessTypes.goto();
    await accessTypes.openAddForm();
    await accessTypes.selectType('Individual');
    await expect(accessTypes.maxParticipantsField()).toHaveValue('1');
    await expect(accessTypes.maxParticipantsField()).toBeDisabled();
  });
});
