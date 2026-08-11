import { Page, expect } from '@playwright/test';

export class TableConfigurationPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Table Configuration")').click();
  }

  /** Tab button has an emoji prefix (🪩) baked into the accessible name - accessible-name match handles it fine, a literal text= match doesn't. */
  async openTablesTab() {
    await this.page.getByRole('button', { name: 'Tables' }).click();
  }

  /**
   * Table Configuration is EVENT-SCOPED, not organizer-wide. A freshly created event
   * cannot be Activated until this is done at least once for that event (toast:
   * "Please set up the event table configuration before changing event status.").
   * Mixed Tables is the default formation - fill Name+Prefix on the pre-populated
   * Table Type 1 (Floating) and Table Type 2 (Fixed), leave Sponsor Category empty
   * on the Fixed type for a general fixed table.
   */
  async setUpMinimalMixedFormation(floatingName: string, floatingPrefix: string, fixedName: string, fixedPrefix: string) {
    await this.page.getByRole('button', { name: /table formation/i }).click();
    await this.page.getByText(/mixed tables/i).click();
    await this.page.getByLabel(/table type 1/i).locator('..').getByLabel(/^name$/i).fill(floatingName);
    await this.page.getByLabel(/table type 1/i).locator('..').getByLabel(/prefix/i).fill(floatingPrefix);
    await this.page.getByLabel(/table type 2/i).locator('..').getByLabel(/^name$/i).fill(fixedName);
    await this.page.getByLabel(/table type 2/i).locator('..').getByLabel(/prefix/i).fill(fixedPrefix);
    await this.page.getByRole('button', { name: /save table formation/i }).click();
  }

  formationBadge(prefix: string) {
    return this.page.getByText(prefix, { exact: true });
  }
}
