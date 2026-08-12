import { Page, expect } from '@playwright/test';

/**
 * Delegate-side "Meeting Reports" (/delegate/<slug>/meeting-report), reached via the
 * "Meeting Reports" link on the Meetings page - it is NOT a separate sidebar item.
 * Confirmed live 2026-08-12: renders one row per meeting (not aggregate counts) with
 * partner, date/time, country, duration, venue/table and a View/Edit action, plus an
 * "Export All Meetings" action and a date filter.
 */
export class DelegateMeetingReportPage {
  constructor(private readonly page: Page) {}

  async gotoFromMeetingsPage() {
    await this.page.locator('a, button').filter({ hasText: /^Meetings$/ }).first().click();
    await this.page.waitForTimeout(1000);
    await this.page.getByText('Meeting Reports', { exact: true }).click();
    await expect(this.page).toHaveURL(/\/meeting-report/, { timeout: 15_000 });
  }

  rows() {
    return this.page.getByRole('row');
  }

  exportAllButton() {
    return this.page.getByRole('button', { name: /export all meetings/i });
  }
}
