import { Page, expect } from '@playwright/test';
import path from 'path';
import { dialogScope } from '../utils';

export interface NewEventInput {
  name: string;
  /** 'YYYY-MM-DD' format, must be in the visible month (no prev/next-month navigation attempted) unless daysFromToday given instead. */
  startDate?: string;
  endDate?: string;
  /** Simpler alternative to startDate/endDate: picks today+N and today+N+1 in the currently open calendar month. */
  daysFromToday?: number;
  timezone: string;
  venue: string;
  address: string;
  country: string;
  city: string;
  email: string;
  contactNumber: string;
  website?: string;
  bannerPath?: string;
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

  /**
   * Some of these option labels (e.g. country names) also exist as plain <option> text in an
   * unrelated native <select> elsewhere on this form (the phone country-code picker) - a bare
   * role=option locator hits both in strict mode, so this scopes to the react-select listbox's
   * own option class instead.
   */
  private async pickReactSelect(labelText: RegExp, optionText: string) {
    await this.page.getByText(labelText).first().locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.locator('.react-select__option', { hasText: optionText }).first().click();
  }

  /**
   * The Add New Event form was substantially redesigned since this method was first written
   * (confirmed live 2026-08-13): it now has a single click-to-open date-RANGE calendar (not
   * separate start/end fields), a Venue Timezone react-select, split Venue Country/City
   * react-selects (City depends on Country), and a REQUIRED Event Banner image upload.
   * Defaults to picking today+3/today+5 in the currently-open calendar month if no explicit
   * dates are given - good enough for a "does this collide" race test; pass startDate/endDate
   * for anything date-sensitive (e.g. deliberately past or far-future events).
   */
  async createEvent(input: NewEventInput) {
    await this.openAddEventForm();
    await this.page.getByLabel(/^event name/i).fill(input.name);

    await this.page.getByPlaceholder(/eg: 2025/i).click();
    await this.page.waitForTimeout(500);
    if (input.startDate && input.endDate) {
      const startDay = String(parseInt(input.startDate.split('-')[2], 10));
      const endDay = String(parseInt(input.endDate.split('-')[2], 10));
      await this.page.getByText(startDay, { exact: true }).click();
      await this.page.waitForTimeout(300);
      await this.page.getByText(endDay, { exact: true }).click();
    } else {
      const start = new Date();
      start.setDate(start.getDate() + (input.daysFromToday ?? 3));
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      await this.page.getByText(String(start.getDate()), { exact: true }).click();
      await this.page.waitForTimeout(300);
      await this.page.getByText(String(end.getDate()), { exact: true }).click();
    }
    await this.page.waitForTimeout(300);

    await this.pickReactSelect(/venue timezone/i, input.timezone);
    await this.page.getByLabel(/^venue \*?$/i).fill(input.venue);
    await this.page.getByLabel(/venue address/i).fill(input.address);
    await this.pickReactSelect(/venue country/i, input.country);
    await this.page.waitForTimeout(500); // City options depend on Country - let them load
    await this.pickReactSelect(/venue city/i, input.city);
    if (input.website) {
      await this.page.getByLabel(/event website/i).fill(input.website);
    }
    await this.page.getByLabel(/event email/i).fill(input.email);
    // This phone widget auto-detects the country from keystrokes as you type - a plain .fill()
    // drops the whole string in at once and it mis-parses (e.g. "9800000000" read as +98
    // Iran + "00000000"). Needs real keystrokes and a leading "+<countrycode>".
    const phoneInput = this.page.getByLabel(/event contact number/i);
    await phoneInput.click();
    await phoneInput.fill('');
    await phoneInput.pressSequentially(input.contactNumber, { delay: 30 });
    await this.page.locator('#banner').setInputFiles(input.bannerPath ?? path.resolve(__dirname, '../../../recon/2026-08-12-gap-sweep/test-banner.png'));

    await this.page.getByRole('button', { name: /add new event/i }).click();
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
