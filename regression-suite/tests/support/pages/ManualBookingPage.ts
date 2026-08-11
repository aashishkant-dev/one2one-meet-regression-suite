import { Page } from '@playwright/test';

export class ManualBookingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Manual Bookings")').click();
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: /add|book/i }).first().click();
  }

  private async pickReactSelect(labelText: RegExp, optionText: string) {
    await this.page.getByText(labelText).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async selectRequestingDelegate(name: string) {
    await this.pickReactSelect(/requesting/i, name);
  }

  /** Same delegate cannot be both Requesting and Target - excluded from the Target dropdown entirely, not just blocked on submit. */
  async targetDropdownOptions() {
    await this.page.getByText(/target/i).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    return this.page.getByRole('listbox').getByRole('option').allTextContents();
  }
}
