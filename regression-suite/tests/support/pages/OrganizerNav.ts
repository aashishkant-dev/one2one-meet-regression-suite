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
    await this.acceptTermsGateIfPresent();
    await expect(this.page).toHaveURL(/\/organizer\/dashboard/, { timeout: 15_000 });
  }

  async loginSuperAdmin(username: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: /log ?in/i }).click();
    await this.acceptTermsGateIfPresent();
    await expect(this.page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 15_000 });
  }

  /**
   * Terms-of-service re-acceptance gate at /auth/terms-of-service, not present on every
   * login (server-side "has this version been accepted" check). Two DIFFERENT UI shapes
   * confirmed live so far, and it can change between them without warning:
   * - 2026-08-12: 5 separate step tabs (tos/security_whitepaper/dpa/sla/eula), one checkbox
   *   + "Continue" click per step.
   * - 2026-08-13: 6 tabs shown at once (adds privacy_policy) but ONE combined checkbox
   *   ("I have read and agree to all...") + a single "Submit" button - same shape the
   *   delegate-side gate uses (DelegateAuthPage.acceptTermsGateIfPresent). A second
   *   concurrent organizer session hitting the OLD Continue-only logic here would loop
   *   uselessly since no "Continue" button exists in this shape - handle both.
   */
  private async acceptTermsGateIfPresent() {
    let guard = 0;
    while (this.page.url().includes('/auth/terms-of-service') && guard < 8) {
      guard++;
      const checkbox = this.page.getByRole('checkbox');
      if (await checkbox.count()) {
        await checkbox.first().check();
      }
      const submitBtn = this.page.getByRole('button', { name: /^submit$/i });
      if (await submitBtn.count()) {
        await submitBtn.click();
        await this.page.waitForTimeout(1200);
        continue;
      }
      await this.page.getByRole('button', { name: /continue/i }).click();
      await this.page.waitForTimeout(1000);
    }
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

  /**
   * Sidebar Settings -> the in-page "My Profile" tab strip (Company Details / Contact
   * Person / Settings). The plain `.last()` locator this used to use is ambiguous with the
   * sidebar's own "Settings" link and with transient error toasts that reuse the word
   * "Settings" in their surrounding DOM - scope tightly to the tab strip instead. Also waits
   * out a transient "Failed to fetch event data" toast seen live 2026-08-12 under heavy
   * concurrent staging load, which otherwise intercepts the click.
   */
  async openMeetingSettings() {
    await this.page.locator('a:has-text("Settings")').last().click();
    const errorToast = this.page.getByText(/failed to fetch/i);
    if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
      await errorToast.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    }
    const tabStrip = this.page.locator('div').filter({ hasText: 'Company Details' }).filter({ hasText: 'Contact Person' }).last();
    await tabStrip.getByText('Settings', { exact: true }).click();
  }

  /** Meeting Settings + Notification Settings + 2FA all submit together via this one button. */
  async saveSettings() {
    await this.page.getByRole('button', { name: 'Update Profile' }).click();
  }

  /** Top-bar "organizer can be a delegate" toggle, aria-label="Set delegate active". Requires a non-DRAFT event selected. */
  async toggleDelegateMode() {
    await this.page.getByRole('button', { name: 'Set delegate active' }).click();
  }

  /**
   * Works for both organizer and super-admin - same aria-label="User profile" dialog
   * trigger and Submit Feedback / Change Password / Logout actions on both roles
   * (confirmed live 2026-08-11, see KNOWLEDGE.md / TC-LS-004, TC-SA-003).
   */
  async openProfileDialog() {
    await this.page.locator('[aria-label="User profile"]').click();
  }

  async logout() {
    await this.openProfileDialog();
    await this.page.getByText(/^logout$/i).click();
    await expect(this.page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  }
}
