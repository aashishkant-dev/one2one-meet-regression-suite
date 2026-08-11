import { Page, expect } from '@playwright/test';

export interface BookMeetingInput {
  meetingWith: string;
  selfNote?: string;
  remarks?: string;
  venue?: string;
}

export class DelegateMeetingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Meetings")').first().click();
  }

  /** Clicking a slot card expands it in place to reveal Block/Book - no modal/navigation. .first() needed since both event days can share visible time strings. */
  async expandSlot(timeLabel: string) {
    await this.page.getByText(timeLabel).first().click();
  }

  /** After a request is sent for a slot, the Book button disappears entirely on reopen - guard fires before the modal can open, not just at submit. */
  bookButtonForSlot(timeLabel: string) {
    return this.page.getByText(timeLabel).first().locator('xpath=ancestor::*[1]').getByRole('button', { name: /^book$/i });
  }

  async openBookMeetingModal(timeLabel: string) {
    await this.expandSlot(timeLabel);
    await this.bookButtonForSlot(timeLabel).click();
  }

  /** Field order confirmed live: Filter By Country, Meeting with (react-select), Self Note, Remarks (pre-filled template), Venue, Book Meeting. */
  async submitBookMeeting(input: BookMeetingInput) {
    await this.page.getByText(/meeting with/i).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: input.meetingWith, exact: false }).click();
    if (input.selfNote) {
      await this.page.getByLabel(/self note/i).fill(input.selfNote);
    }
    if (input.remarks) {
      await this.page.getByLabel(/remarks/i).fill(input.remarks);
    }
    if (input.venue) {
      await this.page.getByLabel(/venue/i).fill(input.venue);
    }
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/delegate/meetingBookingRequest') && r.status() === 200),
      this.page.getByRole('button', { name: /book meeting/i }).click(),
    ]);
    return response;
  }

  dashboardCounter(label: 'Total TimeSlot' | 'Scheduled' | 'Available') {
    return this.page.getByText(label).locator('xpath=following-sibling::*[1]');
  }
}
