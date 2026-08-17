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
    const timestamp = Date.now();
    const uniqueName = `Smoke Event ${timestamp}`;

    await events.goto();
    await events.createEvent({
      name: uniqueName,
      city: 'Kathmandu',
      venue: 'IIG',
      address: 'Test Address',
      timezone: 'Kathmandu',
      country: 'Nepal',
      email: `smoke-${timestamp}@example.com`,
      contactNumber: '+9779800000000',
    });

    // Verify event was created and appears in the list
    await events.searchByName(uniqueName);
    await expect(events.eventRow(uniqueName)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-DM-001 add delegate with primary participant lands inactive by default', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.currentEvent.name, /Delegate/i);

    const delegates = new DelegatesPage(organizerPage);
    const timestamp = Date.now();
    const companyName = `Smoke Test Co ${timestamp}`;

    await delegates.goto();
    await delegates.createDelegate({
      companyName,
      companyEmail: `smoke-${timestamp}@example.com`,
      accessType: 'Individual Access',
      country: 'Nepal',
      city: 'Kathmandu',
      contactNumber: '+9779800000000',
      companyDescription: 'Automation smoke fixture',
      participantSalutation: 'Mr',
      participantFirstName: 'Smoke',
      participantLastName: 'Test',
      participantEmail: `smoke-participant-${timestamp}@example.com`,
      participantContactNumber: '+9779800000001',
    });

    // Verify delegate was created
    const delegateRow = delegates.row(companyName);
    await expect(delegateRow).toBeVisible({ timeout: 10_000 });

    // Verify new delegates are inactive by default
    const toggleSwitch = delegateRow.locator('[role="switch"], [aria-checked]').first();
    await expect(toggleSwitch).toHaveAttribute('aria-checked', 'false', { timeout: 5_000 });
  });

  test('TC-AT-001 Individual access type auto-fills Max Participants=1 and disables the field', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const accessTypes = new AccessTypesPage(organizerPage);

    await accessTypes.goto();
    await accessTypes.openAddForm();
    await accessTypes.selectType('Individual');

    // Verify form auto-fills and disables the Max Participants field for Individual access
    const maxParticipantsField = accessTypes.maxParticipantsField();
    await expect(maxParticipantsField).toHaveValue('1', { timeout: 5_000 });
    await expect(maxParticipantsField).toBeDisabled({ timeout: 5_000 });
  });
});
