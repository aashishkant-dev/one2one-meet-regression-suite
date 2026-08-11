import { Page, expect } from '@playwright/test';

export class ReportsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Reports")').click();
  }

  async gotoTab(tab: 'Overview' | 'Delegate Report' | 'Login Activity' | 'No-show') {
    await this.page.getByRole('tab', { name: tab }).click();
  }

  counter(label: string) {
    return this.page.getByText(label, { exact: false }).locator('xpath=following-sibling::*[1]');
  }

  async expectSectionRenders(label: string) {
    await expect(this.page.getByText(label)).toBeVisible();
  }
}
