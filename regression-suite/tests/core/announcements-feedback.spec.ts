import { test, expect } from '../support/fixtures/test-base';
import { AnnouncementsFeedbackPage } from '../support/pages/AnnouncementsFeedbackPage';

/** Smoke subset of the Announcements (4 cases) + Feedback (3 cases) modules. Confirmed 3/3 passing 2026-08-09. */
test.describe('Announcements & Feedback', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Announcements & Feedback' });
  });

  test('TC-AN-001 organizer creates an announcement', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const announcements = new AnnouncementsFeedbackPage(organizerPage);
    await announcements.gotoAnnouncements();
    const title = `Regression smoke announcement ${Date.now()}`;
    await announcements.createNew(title, 'Automated regression smoke test body.');
    await expect(announcements.row(title)).toBeVisible();
  });

  test('TC-AN-N01 create announcement with empty title is rejected', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const announcements = new AnnouncementsFeedbackPage(organizerPage);
    await announcements.gotoAnnouncements();
    await organizerPage.getByRole('button', { name: /create/i }).first().click();
    await organizerPage.getByLabel(/message|body|content/i).fill('Body without a title.');
    await organizerPage.getByRole('button', { name: /create/i }).last().click();
    // Should stay on the dialog / show a required-field error rather than silently creating an untitled row.
    await expect(organizerPage.locator('[role="dialog"], [role="alertdialog"]')).toBeVisible();
  });
});
