import { Page } from '@playwright/test';

export class LiveMeetingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Meetings")').first().click();
  }

  /** Date picker only offers days that actually have a meeting agenda - correct empty-state design, not a bug to work around. */
  availableDateButtons() {
    return this.page.getByRole('button', { name: /\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i });
  }
}
