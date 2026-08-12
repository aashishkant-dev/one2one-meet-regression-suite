import { test, expect } from '../support/fixtures/test-base';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { EODelegateTogglePage } from '../support/pages/EODelegateTogglePage';
import { seededData } from '../support/fixtures/seeded-data';
import { env } from '../support/env';

/**
 * Gap-fill for the EO-Delegate Toggle module (../../One2One_Meet_TestCases_NewGaps_2026-08-12.xlsx
 * "EO-Delegate Toggle (Gaps)" sheet) - was 2 rows total in the merged register (TC-EOT-001 done,
 * TC-EOT-002 left with no content). Added + executed live on staging 2026-08-12.
 */
test.describe('EO-Delegate Toggle', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'EO-Delegate Toggle' });
  });

  test('TC-EOT-002 EO toggles into Delegate mode for an event with at least one active event', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);

    const toggle = new EODelegateTogglePage(organizerPage);
    await toggle.clickToggleOn();
    // Handles both observed states: first-ever toggle (Create Delegate Account wizard) and
    // subsequent toggles once that delegate profile already exists (direct switch).
    await toggle.completeCreateAccountWizardIfPresent();
    await toggle.expectInDelegateMode(env.bookingEventSlug);
  });

  test('TC-EOT-003 toggling back from Delegate mode restores the Organizer dashboard', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);

    const toggle = new EODelegateTogglePage(organizerPage);
    await toggle.clickToggleOn();
    await toggle.completeCreateAccountWizardIfPresent();
    await expect(organizerPage).toHaveURL(/\/delegate\//, { timeout: 15_000 });

    await toggle.clickToggleOff();
    await toggle.expectInOrganizerMode();
  });

  test('TC-EOT-004 organizer-only routes are route-guarded while in Delegate mode', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);

    const toggle = new EODelegateTogglePage(organizerPage);
    await toggle.clickToggleOn();
    await toggle.completeCreateAccountWizardIfPresent();
    await expect(organizerPage).toHaveURL(/\/delegate\//, { timeout: 15_000 });

    await organizerPage.goto('/organizer/settings');
    await organizerPage.waitForTimeout(2000);
    // Confirmed live: direct navigation to an organizer-only route while toggled into
    // Delegate mode redirects back to the delegate dashboard rather than rendering settings.
    await expect(organizerPage).not.toHaveURL(/\/organizer\/settings/);
    await expect(organizerPage).toHaveURL(/\/delegate\//);

    await toggle.clickToggleOff();
  });
});
