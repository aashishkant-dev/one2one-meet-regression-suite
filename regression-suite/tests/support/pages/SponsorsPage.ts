import { Page, expect } from '@playwright/test';
import { dialogScope } from '../utils';

export class SponsorsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Sponsors")').first().click();
    await expect(this.page.locator('body')).toContainText(/Sponsor/i);
  }

  /** Promotion has no clean single-click revert in this app - pick a delegate you're OK leaving permanently promoted on shared fixtures. */
  async promoteDelegateToSponsor(delegateCompanyName: string, category: string) {
    await this.page.getByRole('row', { name: new RegExp(delegateCompanyName) })
      .getByRole('button', { name: /assign fixed table|promote/i })
      .click();
    const dialog = dialogScope(this.page);
    await dialog.getByText(/category/i).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: category, exact: true }).click();
    await dialog.getByRole('button', { name: /save|promote|assign/i }).click();
  }

  sponsorRow(name: string) {
    return this.page.getByRole('row', { name: new RegExp(name) });
  }
}
