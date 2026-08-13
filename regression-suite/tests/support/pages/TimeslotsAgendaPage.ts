import { Page, expect } from '@playwright/test';

export class TimeslotsAgendaPage {
  constructor(private readonly page: Page) {}

  async gotoTimeslots() {
    await this.page.locator('a:has-text("Timeslots")').click();
    // List pages can render "Loading..." as fully settled before real row data arrives - wait for real content, not networkidle.
    await expect(this.page.locator('body')).toContainText(/total number of Timeslot/i, { timeout: 15_000 });
  }

  async gotoAgenda() {
    await this.page.locator('a:has-text("Agenda")').click();
  }

  async addTimeslotDuration(minutes: number) {
    await this.page.getByRole('button', { name: /add/i }).click();
    // Duration field is a spinbutton, accessible name "Duration (minutes)", defaults to 60.
    await this.page.getByRole('spinbutton', { name: /duration \(minutes\)/i }).fill(String(minutes));
    // Button copy changed from "Save" to "Add New Timeslot" sometime after 2026-08-09 - match both.
    await this.page.getByRole('button', { name: /^save$|^add new timeslot$/i }).click();
  }

  saveButton() {
    return this.page.getByRole('button', { name: /^save$|^add new timeslot$/i });
  }

  durationRow(minutes: number) {
    return this.page.getByRole('row', { name: new RegExp(`${minutes}`) });
  }

  async deleteDuration(minutes: number) {
    await this.durationRow(minutes).getByRole('button', { name: /delete/i }).click();
    await this.page.locator('[role="dialog"], [role="alertdialog"]').getByRole('button', { name: /delete/i }).click();
  }

  /**
   * Section headers are title case in the DOM ("Pre-Event Agenda") even though CSS
   * text-transform renders them uppercase visually. Assert against real DOM text.
   */
  agendaSectionHeader(section: 'Pre-Event Agenda' | 'Event Agenda' | 'Post-Event Agenda') {
    return this.page.getByText(section, { exact: true });
  }
}
