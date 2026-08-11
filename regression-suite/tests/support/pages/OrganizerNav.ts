import { Page, expect } from '@playwright/test';

/**
 * Login + sidebar/top-bar navigation shared by every organizer-side spec.
 * Selectors below are pinned to gotchas confirmed live on staging 2026-08-09
 * (see ../../../../KNOWLEDGE.md) - do not "simplify" back to naive locators,
 * they were naive once and that's what broke.
 */
export class OrganizerNav {
  constructor(private readonly page: Page) {}

  async login(username: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: /log ?in/i }).click();
    await expect(this.page).toHaveURL(/\/organizer\/dashboard/, { timeout: 15_000 });
  }

  async loginSuperAdmin(username: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: /log ?in/i }).click();
    await expect(this.page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15_000 });
  }

  async goToSidebar(label: string) {
    await this.page.locator('a').filter({ hasText: new RegExp(`^${label}$`) }).first().click();
  }

  /**
   * Switches the active event via the top-bar pill, then polls for real
   * content unique to the new event instead of trusting the pill's own text
   * (the app's data layer lags the pill by a variable amount - see
   * KNOWLEDGE.md "event-switch pill text updates BEFORE the app's data layer does").
   */
  async switchEventAndWaitFor(eventName: string, contentMarker: string | RegExp) {
    const pillAlreadyShowsTarget = await this.page
      .locator('header')
      .getByText(eventName, { exact: true })
      .isVisible()
      .catch(() => false);

    if (!pillAlreadyShowsTarget) {
      // Open the event switcher dropdown (top-bar pill), then pick the target event by name.
      await this.page.locator('header').getByRole('button').first().click();
      await this.page.getByRole('option', { name: eventName, exact: true })
        .or(this.page.getByText(eventName, { exact: true }))
        .first()
        .click();
    }

    // The pill's own text updates before the app's data layer catches up - poll for real
    // content on the current page rather than trusting the pill alone.
    await expect(this.page.locator('body')).toContainText(contentMarker, { timeout: 10_000 });
  }

  /** Sidebar Settings -> the blue gear "Settings" icon-card (2-card layout, confirmed 2026-08-09). */
  async openMeetingSettings() {
    await this.page.locator('a:has-text("Settings")').last().click();
    await this.page.getByRole('link', { name: 'Settings' }).or(this.page.getByText('Settings', { exact: true })).last().click();
  }

  /** Meeting Settings + Notification Settings + 2FA all submit together via this one button. */
  async saveSettings() {
    await this.page.getByRole('button', { name: 'Update Profile' }).click();
  }

  /** Top-bar "organizer can be a delegate" toggle, aria-label="Set delegate active". Requires a non-DRAFT event selected. */
  async toggleDelegateMode() {
    await this.page.getByRole('button', { name: 'Set delegate active' }).click();
  }
}
