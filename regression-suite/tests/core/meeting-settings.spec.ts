import { test, expect } from '../support/fixtures/test-base';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { MeetingSettingsPage } from '../support/pages/MeetingSettingsPage';
import { seededData } from '../support/fixtures/seeded-data';

/**
 * Gap-fill for the merged register's "Settings" sheet - TC-SG-001..006 were all "Not Tested".
 * These settings are SHARED live state for Booking Test Event (other specs, e.g.
 * meeting-booking.spec.ts, read them) - every test here reads the current value first and
 * restores it before finishing, even on assertion failure, to avoid corrupting other specs.
 * Executed live on staging 2026-08-12.
 *
 * TC-SG-001/002/006 (the three numeric boundary cases) are `test.skip`, not automated: the
 * "Accept/Reject after N hours" / "Cancel before Event Hour" / booking-window number fields
 * use a custom stepper component whose React dirty-state would not flip for the automation -
 * tried plain .fill(), select-all+type+blur, and native-setter+dispatchEvent(input/change);
 * "Update Profile" stayed disabled every time even though the displayed value visibly changed.
 * Toggle-based settings (TC-SG-003/004/005 below) are NOT affected and pass normally, so this
 * looks specific to that stepper widget, not the save flow in general. Needs either a
 * maintainer with app source access to find the real trigger, or manual QA.
 */
test.describe('Meeting Settings (Gap Coverage)', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Settings' });
  });

  test.skip('TC-SG-002 Accept/Reject-after-N-hours field enforces a sane boundary (rejects negative)', async () => {
    // Not automated - see file header. "Update Profile" never enables for this stepper field.
  });

  test('TC-SG-003 "Auto accept if requested by Sponsors" toggle saves and persists on reload', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);
    await nav.openMeetingSettings();

    const settings = new MeetingSettingsPage(organizerPage);
    const toggle = settings.toggle('Auto accept if requested by Sponsors');
    const original = await toggle.isChecked();

    await settings.setToggle('Auto accept if requested by Sponsors', !original);
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1500);
    await organizerPage.reload();
    await organizerPage.waitForTimeout(1500);
    const afterReload = await settings.toggle('Auto accept if requested by Sponsors').isChecked();

    // restore
    await settings.setToggle('Auto accept if requested by Sponsors', original);
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1000);

    expect(afterReload).toBe(!original);
  });

  test('TC-SG-004 "Allow multiple meeting requests" toggle saves and persists on reload', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);
    await nav.openMeetingSettings();

    const settings = new MeetingSettingsPage(organizerPage);
    const toggle = settings.toggle('Allow multiple meeting requests');
    const original = await toggle.isChecked();

    await settings.setToggle('Allow multiple meeting requests', !original);
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1500);
    await organizerPage.reload();
    await organizerPage.waitForTimeout(1500);
    const afterReload = await settings.toggle('Allow multiple meeting requests').isChecked();

    await settings.setToggle('Allow multiple meeting requests', original);
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1000);

    expect(afterReload).toBe(!original);
  });

  test('TC-SG-005 Auto Rejection and Auto Acceptance: does the backend enforce mutual exclusivity?', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(organizerPage);
    await nav.switchEventAndWaitFor(seededData.bookingTestEvent.name, /Booking Test Event/i);
    await nav.openMeetingSettings();

    const settings = new MeetingSettingsPage(organizerPage);
    const rejectionToggle = settings.toggle('Enable Auto Rejection');
    const acceptanceToggle = settings.toggle('Enable Auto Acceptance');
    const origRejection = await rejectionToggle.isChecked();
    const origAcceptance = await acceptanceToggle.isChecked();

    // Try to turn BOTH on.
    await settings.setToggle('Enable Auto Rejection', true);
    await settings.setToggle('Enable Auto Acceptance', true);
    const rejectionAfterBothAttempt = await rejectionToggle.isChecked();
    const acceptanceAfterBothAttempt = await acceptanceToggle.isChecked();
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1500);
    await organizerPage.reload();
    await organizerPage.waitForTimeout(1500);
    const rejectionPersisted = await settings.toggle('Enable Auto Rejection').isChecked();
    const acceptancePersisted = await settings.toggle('Enable Auto Acceptance').isChecked();

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `UI state right after enabling both: rejection=${rejectionAfterBothAttempt}, acceptance=${acceptanceAfterBothAttempt}. After save+reload: rejection=${rejectionPersisted}, acceptance=${acceptancePersisted}.`,
    });

    // restore
    await settings.setToggle('Enable Auto Rejection', origRejection);
    await settings.setToggle('Enable Auto Acceptance', origAcceptance);
    await nav.saveSettings();
    await organizerPage.waitForTimeout(1000);

    expect(rejectionPersisted && acceptancePersisted).toBe(false);
  });

  test.skip('TC-SG-006 Meeting Cancel-before-Event-Hour boundary: rejects a negative value', async () => {
    // Not automated - see file header. "Update Profile" never enables for this stepper field.
  });

  test.skip('TC-SG-001 Booking window: Close-before-Event set earlier than Start-before-Event is rejected or self-corrects', async () => {
    // Not automated - see file header. "Update Profile" never enables for this stepper field.
  });
});
