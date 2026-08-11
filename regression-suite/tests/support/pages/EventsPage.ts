import { Page, expect } from '@playwright/test';
import { dialogScope } from '../utils';

export interface NewEventInput {
  name: string;
  city: string;
  venue: string;
  address: string;
  email: string;
  contactNumber: string;
  website?: string;
}

export class EventsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Events")').first().click();
    await expect(this.page.locator('body')).toContainText(/Events/i);
  }

  async openAddEventForm() {
    await this.page.getByRole('button', { name: /add new event/i }).click();
  }

  /** Exact in-table placeholder - the global top-bar "Search..." omnisearch shares the substring "Search" and must not match. */
  async searchByName(term: string) {
    await this.page.locator('input[placeholder="Search Event Name"]').fill(term);
  }

  async save() {
    await this.page.getByRole('button', { name: /^save$/i }).click();
  }

  /** TC-EV-001 golden path: create an event with all required fields, expect inactive-by-default + generated slug. */
  async createEvent(input: NewEventInput) {
    await this.openAddEventForm();
    await this.page.getByLabel(/event name/i).fill(input.name);
    await this.page.getByLabel(/^city/i).fill(input.city);
    await this.page.getByLabel(/venue/i).fill(input.venue);
    await this.page.getByLabel(/address/i).fill(input.address);
    await this.page.getByLabel(/event email/i).fill(input.email);
    await this.page.getByLabel(/contact number/i).fill(input.contactNumber);
    if (input.website) {
      await this.page.getByLabel(/website/i).fill(input.website);
    }
    await this.save();
  }

  eventRow(eventName: string) {
    return this.page.getByRole('row', { name: new RegExp(eventName) });
  }

  statusToggle(eventName: string) {
    return this.eventRow(eventName).getByRole('button', { name: /set delegate active|status/i })
      .or(this.eventRow(eventName).locator('[role="switch"], [aria-checked]'));
  }

  /** Requires Table Configuration to already exist for the event, else toast blocks activation. */
  async activateEvent(eventName: string) {
    await this.statusToggle(eventName).first().click();
    const dialog = dialogScope(this.page);
    await dialog.getByRole('button', { name: /activate event/i }).click();
  }

  async deactivateEvent(eventName: string) {
    await this.statusToggle(eventName).first().click();
  }
}
