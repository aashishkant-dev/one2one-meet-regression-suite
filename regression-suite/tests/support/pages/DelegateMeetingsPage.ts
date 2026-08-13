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

  /**
   * After a request is sent for a slot, the Book button disappears entirely on reopen - guard
   * fires before the modal can open, not just at submit. Card structure confirmed live
   * 2026-08-13: the time label and the Block/Book row are both direct children of the same
   * card div, three levels up from the text node - ancestor::*[1] (the old value here) never
   * actually reached it.
   */
  bookButtonForSlot(timeLabel: string) {
    return this.page.getByText(timeLabel).first().locator('xpath=ancestor::*[3]').getByRole('button', { name: /^book$/i });
  }

  async openBookMeetingModal(timeLabel: string) {
    await this.expandSlot(timeLabel);
    await this.bookButtonForSlot(timeLabel).click();
  }

  /** Confirmed live 2026-08-13: "Slot successfully blocked" toast on success, no confirmation dialog. */
  async blockSlot(timeLabel: string) {
    await this.expandSlot(timeLabel);
    await this.page.getByText(timeLabel).first().locator('xpath=ancestor::*[3]').getByRole('button', { name: /^block$/i }).click();
    await expect(this.page.getByText(/slot successfully blocked/i)).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Field order confirmed live: Filter By Country, Meeting with (react-select), Self Note,
   * Remarks (pre-filled template), Venue, Book Meeting. "Meeting with" starts
   * aria-disabled="true" while the modal fetches the eligible-delegate list for this slot -
   * confirmed live 2026-08-13 - and the bare getByText(/meeting with/i) label match is
   * ambiguous with "Filter By Country" 's own react-select control in strict mode, so this
   * scopes to the exact label and waits out the disabled state first.
   */
  async submitBookMeeting(input: BookMeetingInput) {
    const meetingWithControl = this.page
      .getByText('Meeting with', { exact: true })
      .locator('xpath=following::div[contains(@class,"react-select__control")][1]');
    await expect(meetingWithControl).not.toHaveClass(/is-disabled/, { timeout: 10_000 });
    await meetingWithControl.click();
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

  /**
   * Pending-request Accept/Reject icon buttons on a slot card, title="Accept"/"Reject" (no
   * visible text). Confirmed live 2026-08-13. Scoped to the smallest ancestor that contains
   * exactly one Accept and one Reject button (searching outward level by level) rather than a
   * fixed xpath depth - fixed depths (like bookButtonForSlot's ancestor::*[3]) turned out to
   * vary between the "open slot" card and this "pending request" card.
   */
  private pendingRequestCard(timeLabel: string) {
    return this.page.getByText(timeLabel).first().locator(
      'xpath=ancestor::*[.//button[@title="Accept"] and count(.//button[@title="Accept"])=1][1]'
    );
  }

  acceptButtonForSlot(timeLabel: string) {
    return this.pendingRequestCard(timeLabel).getByRole('button', { name: 'Accept' });
  }

  rejectButtonForSlot(timeLabel: string) {
    return this.pendingRequestCard(timeLabel).getByRole('button', { name: 'Reject' });
  }

  dashboardCounter(label: 'Total TimeSlot' | 'Scheduled' | 'Available') {
    return this.page.getByText(label).locator('xpath=following-sibling::*[1]');
  }
}
