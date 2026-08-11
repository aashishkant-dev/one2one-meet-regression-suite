import { Page } from '@playwright/test';

export class AnnouncementsFeedbackPage {
  constructor(private readonly page: Page) {}

  async gotoAnnouncements() {
    await this.page.locator('a:has-text("Announcements")').click();
  }

  async gotoFeedback() {
    await this.page.locator('a:has-text("Feedback")').click();
  }

  /** "Create" text collides between the list page's own trigger button and the dialog's submit button - scope to .last() within the open dialog. */
  async createNew(title: string, body: string) {
    await this.page.getByRole('button', { name: /create/i }).first().click();
    await this.page.getByLabel(/title/i).fill(title);
    await this.page.getByLabel(/message|body|content/i).fill(body);
    await this.page.getByRole('button', { name: /create/i }).last().click();
  }

  row(title: string) {
    return this.page.getByRole('row', { name: new RegExp(title) });
  }
}
