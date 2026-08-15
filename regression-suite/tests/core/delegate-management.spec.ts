import { test, expect } from '../support/fixtures/test-base';
import { DelegatesPage } from '../support/pages/DelegatesPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { seededData } from '../support/fixtures/seeded-data';

/**
 * Smoke subset of the 22-case Delegate Management module. KNOWLEDGE.md documents 6/6
 * passing on 2026-08-09 (TC-DM-001, TC-DM-009/N01, TC-DM-N04, TC-DM-N03, TC-DM-006,
 * TC-DM-013) - these 3 cover the create/activate/validate golden paths from that run.
 */
test.describe('Delegate Management', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Delegate Management' });
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
      companyDescription: 'Regression smoke fixture',
      participantSalutation: 'Mr',
      participantFirstName: 'Smoke',
      participantLastName: 'Test',
      participantEmail: `smoke-participant-${Date.now()}@example.com`,
      participantContactNumber: '+9779800000001',
    });

    await expect(delegates.row(companyName)).toBeVisible();
    // Inactive by default - confirmed behavior, see TC-DM-014 dependency note in the register.
    await expect(delegates.row(companyName).locator('[role="switch"], [aria-checked]').first())
      .toHaveAttribute('aria-checked', 'false');
  });

  test('TC-DM-N04 submit Add Delegate with required fields blank is rejected', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const delegates = new DelegatesPage(organizerPage);
    await delegates.goto();
    await delegates.openAddForm();
    await organizerPage.getByRole('button', { name: /^save$|^create$/i }).click();
    await expect(organizerPage).toHaveURL(/\/organizer\/delegates\/add/);
  });

  test('TC-DM-006 activate delegate via row Status toggle', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.pastEvent.name, /Delegate/i);

    const delegates = new DelegatesPage(organizerPage);
    await delegates.goto();
    const target = seededData.pastEvent.knownUnpromotedDelegates[0];
    const toggle = delegates.row(target).locator('[role="switch"], [aria-checked]').first();
    const before = await toggle.getAttribute('aria-checked');
    await delegates.toggleStatus(target);
    await expect(toggle).not.toHaveAttribute('aria-checked', before ?? '');
    // round-trip back to original state so the shared fixture isn't left mutated
    await delegates.toggleStatus(target);
    await expect(toggle).toHaveAttribute('aria-checked', before ?? 'false');
  });
});
