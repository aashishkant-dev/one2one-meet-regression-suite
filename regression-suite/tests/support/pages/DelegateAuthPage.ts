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
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/delegate\//, { timeout: 15_000 });
  }

  async expectInvalidLoginError() {
    await expect(this.page.getByText(/invalid login|not found/i)).toBeVisible();
  }
}
