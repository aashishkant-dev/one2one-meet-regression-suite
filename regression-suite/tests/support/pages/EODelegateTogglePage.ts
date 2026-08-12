import { Page, expect } from '@playwright/test';

/**
 * The organizer-can-be-a-delegate toggle (top-bar, aria-label "Set delegate active" /
 * "Set delegate inactive" depending on state). Confirmed live 2026-08-12:
 *
 * - First-ever toggle for an event where the EO has no delegate profile yet opens a
 *   2-step "Create Delegate Account" wizard (Company Information -> Participant
 *   Information, both pre-filled from the org's own profile) before it will switch you in.
 * - Once that profile exists, every later toggle switches directly to
 *   /delegate/<slug>/dashboard with no modal.
 * - The toggle button becomes aria-label="Set delegate inactive" while in delegate mode -
 *   click it again to return to /organizer/dashboard.
 * - Organizer-only routes are route-guarded while in delegate mode (redirect back to the
 *   delegate dashboard rather than rendering).
 */
export class EODelegateTogglePage {
  constructor(private readonly page: Page) {}

  /**
   * The toggle silently no-ops if clicked immediately after switching events - the pill's
   * text updates before the app's underlying event-context data layer does (same lag as
   * OrganizerNav.switchEventAndWaitFor documents for page content). A settle wait plus one
   * retry click covers it without leaking the timing detail into every spec.
   */
  async clickToggleOn() {
    await this.page.waitForTimeout(1500);
    const btn = this.page.getByRole('button', { name: 'Set delegate active' });
    await btn.click();
    await this.page.waitForTimeout(2000);
    const stillOrganizerOnly = this.page.url().includes('/organizer/dashboard')
      && !(await this.createAccountModal().isVisible().catch(() => false));
    if (stillOrganizerOnly) {
      await btn.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async clickToggleOff() {
    await this.page.getByRole('button', { name: 'Set delegate inactive' }).click();
  }

  createAccountModal() {
    return this.page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: 'Create Delegate Account' });
  }

  /** Completes the 2-step Create Delegate Account wizard if it appears; no-op if the toggle switched directly instead. */
  async completeCreateAccountWizardIfPresent(accessType = 'Shared Access') {
    const modal = this.createAccountModal();
    if (!(await modal.isVisible({ timeout: 3000 }).catch(() => false))) {
      return false;
    }
    await modal
      .getByText(/^access type/i)
      .first()
      .locator('xpath=following::div[contains(@class,"react-select__control")][1]')
      .click();
    await this.page.getByRole('option', { name: /shared access|individual access/i }).first().click();

    // Step 1 -> Step 2
    await modal.getByRole('button', { name: /^next$/i }).click();
    await this.page.waitForTimeout(500);
    // Step 2 final submit
    await modal.getByRole('button', { name: /create delegate account/i }).click();
    return true;
  }

  async expectInDelegateMode(eventSlug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/delegate/${eventSlug}/dashboard`), { timeout: 15_000 });
    await expect(this.page.locator('header')).toContainText('Delegate');
  }

  async expectInOrganizerMode() {
    await expect(this.page).toHaveURL(/\/organizer\/dashboard/, { timeout: 15_000 });
  }
}
