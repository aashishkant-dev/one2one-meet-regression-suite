import { Page, expect } from '@playwright/test';

export class DelegateAuthPage {
  constructor(private readonly page: Page) {}

  /**
   * Delegate cannot log in from the generic /auth/login page (returns "Invalid Login.
   * Kindly connect with event organizer to login with delegate account."). Must use the
   * per-event slug page, which has its own embedded Username/Password form.
   */
  async login(eventSlug: string, username: string, password: string) {
    await this.page.goto(`/delegate/${eventSlug}`);
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: /log ?in/i }).click();
    await this.acceptTermsGateIfPresent();
  }

  /**
   * New gotcha confirmed live 2026-08-13: delegate logins can land on
   * /auth/terms-of-service with a DIFFERENT layout than the organizer/super-admin gate
   * (OrganizerNav.acceptTermsGateIfPresent) - one combined checkbox ("I have read and agree
   * to all of the above documents...") covering all 6 docs (eula/tos/dpa/sla/privacy_policy/
   * security_whitepaper tabs) plus a single Submit button, not one Continue click per tab.
   */
  private async acceptTermsGateIfPresent() {
    await this.page.waitForTimeout(2000);
    if (this.page.url().includes('/auth/terms-of-service')) {
      await this.page.getByRole('checkbox').check();
      await this.page.getByRole('button', { name: /^submit$/i }).click();
      await this.page.waitForTimeout(1500);
    }
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/delegate\//, { timeout: 15_000 });
  }

  async expectInvalidLoginError() {
    await expect(this.page.getByText(/invalid login|not found/i)).toBeVisible();
  }
}
