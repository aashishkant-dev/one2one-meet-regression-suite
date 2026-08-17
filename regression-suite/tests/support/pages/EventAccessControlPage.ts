import { Page } from '@playwright/test';
import { DelegateAuthPage } from './DelegateAuthPage';

export type EventState = 'past' | 'current' | 'future';

export class EventAccessControlPage {
  private delegateAuthPage: DelegateAuthPage;

  constructor(private page: Page) {
    this.delegateAuthPage = new DelegateAuthPage(page);
  }

  // Access Control Checks
  async canAccessDelegateBooking(eventSlug: string, username: string, password: string): Promise<boolean> {
    try {
      // Attempt to log in and check if booking UI is accessible
      await this.delegateAuthPage.login(eventSlug, username, password);

      // Check if booking UI is visible
      const bookingUI = this.page.locator(
        '[data-testid="booking-section"], .booking-container, [class*="Booking"]'
      );

      return await bookingUI.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  async canAccessMeetingRequests(eventSlug: string, username: string, password: string): Promise<boolean> {
    try {
      await this.delegateAuthPage.login(eventSlug, username, password);

      const meetingUI = this.page.locator(
        '[data-testid="meeting-requests"], [class*="MeetingRequest"], [class*="MyMeetings"]'
      );

      return await meetingUI.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  // Event State Detection
  async getEventState(eventSlug: string, username: string, password: string): Promise<EventState | null> {
    try {
      await this.delegateAuthPage.login(eventSlug, username, password);

      // Check for state-specific messages
      const pageText = await this.page.content();

      if (pageText.includes('concluded') || pageText.includes('finished') || pageText.includes('ended')) {
        return 'past';
      }

      if (pageText.includes('in progress') || pageText.includes('live meeting') || pageText.includes('currently')) {
        return 'current';
      }

      if (pageText.includes('upcoming') || pageText.includes('future') || pageText.includes('available')) {
        return 'future';
      }

      // Fallback: if booking is accessible, assume future
      const hasBooking = await this.canAccessDelegateBooking(eventSlug, username, password);
      return hasBooking ? 'future' : 'past';
    } catch {
      return null;
    }
  }

  // Assertions
  async expectEventConcluded() {
    const concludedMsg = this.page.getByText(/event concluded|event has ended|event finished|no longer available/i);
    await concludedMsg.waitFor({ timeout: 10000 });
  }

  async expectEventInProgress() {
    const inProgressMsg = this.page.getByText(/in progress|meeting is live|currently happening|event is live/i);
    await inProgressMsg.waitFor({ timeout: 10000 });
  }

  async expectBookingClosed(reason?: RegExp) {
    const bookingSection = this.page.locator('[data-testid="booking-section"], [class*="Booking"]');

    // Booking should not be visible
    const isVisible = await bookingSection.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      throw new Error('Booking section should be hidden/disabled for this event');
    }

    // Check for reason message if provided
    if (reason) {
      const reasonMsg = this.page.getByText(reason);
      await reasonMsg.waitFor({ timeout: 5000 });
    }
  }

  async expectBookingAvailable() {
    const bookingSection = this.page.locator(
      '[data-testid="booking-section"], .booking-container, [class*="Booking"]'
    );

    await bookingSection.waitFor({ state: 'visible', timeout: 10000 });
  }

  async expectNoAvailableSlots() {
    const emptyMsg = this.page.getByText(/no available slots|no timeslots|booking closed|closed/i);
    await emptyMsg.waitFor({ timeout: 10000 });
  }

  async expectBookingWindowClosed() {
    const windowMsg = this.page.getByText(/booking window.*closed|booking period.*ended|registration.*closed/i);
    await windowMsg.waitFor({ timeout: 10000 });
  }

  async expectAccessDenied() {
    // Delegate should be redirected or shown access denied message
    const accessDenied = this.page.getByText(/access denied|not authorized|not allowed|404/i);

    try {
      await accessDenied.waitFor({ timeout: 10000 });
    } catch {
      // Check if redirected to login
      if (this.page.url().includes('/auth/login') || this.page.url().includes('/login')) {
        return; // Access denied via redirect is acceptable
      }
      throw new Error('Expected access denied but page is accessible');
    }
  }

  // Organizer-side access control
  async canOrganizerApproveRequests(eventSlug: string): Promise<boolean> {
    try {
      // Navigate to event's meeting requests (organizer view)
      await this.page.goto(`/organizer/events/${eventSlug}/requests`);
      await this.page.waitForLoadState('networkidle');

      const requestsContainer = this.page.locator('[class*="Request"], [data-testid="requests"]');
      return await requestsContainer.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  async expectOrganizerCanManageEvent(eventSlug: string): Promise<boolean> {
    try {
      // Check if organizer can access event management page
      await this.page.goto(`/organizer/events/${eventSlug}/settings`);
      await this.page.waitForLoadState('networkidle');

      const settingsUI = this.page.locator('[class*="Settings"], [data-testid="event-settings"]');
      return await settingsUI.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  async expectEventReadOnly() {
    // For past events: no edit buttons, no delete options
    const editBtn = this.page.getByRole('button', { name: /edit|modify|update/i });
    const deleteBtn = this.page.getByRole('button', { name: /delete|remove|cancel/i });

    const hasEdit = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasDelete = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEdit || hasDelete) {
      throw new Error('Event should be read-only but edit/delete buttons are visible');
    }
  }

  // Helpers
  async logout() {
    const profileBtn = this.page.getByRole('button', { name: /profile|menu|user/i });
    if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileBtn.click();
      const logoutBtn = this.page.getByRole('menuitem', { name: /logout|sign out/i });
      await logoutBtn.click();
      await this.page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    }
  }
}
