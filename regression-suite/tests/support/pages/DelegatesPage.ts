import { Page, expect } from '@playwright/test';
import { dialogScope } from '../utils';

export interface NewDelegateInput {
  companyName: string;
  companyEmail: string;
  accessType: string; // e.g. 'Individual' | 'Shared'
  country: string;
  city: string;
  contactNumber: string;
  companyDescription: string;
  participantSalutation: string;
  participantFirstName: string;
  participantLastName: string;
  participantEmail: string;
  participantContactNumber: string;
}

export class DelegatesPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Delegates")').first().click();
    await expect(this.page.locator('body')).toContainText(/Delegate/i);
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: /add new/i }).click();
    await expect(this.page).toHaveURL(/\/organizer\/delegates\/add/);
  }

  private async pickReactSelect(labelText: RegExp, optionText: string) {
    await this.page.getByText(labelText).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  /** TC-DM-001: create with primary participant. Delegate lands inactive by default - must Activate before any credential-email test. */
  async createDelegate(input: NewDelegateInput) {
    await this.openAddForm();
    await this.page.getByLabel(/company name/i).fill(input.companyName);
    await this.page.getByLabel(/company email/i).fill(input.companyEmail);
    await this.pickReactSelect(/access type/i, input.accessType);
    await this.pickReactSelect(/^country/i, input.country);
    await this.pickReactSelect(/^city/i, input.city);
    await this.page.getByLabel(/contact number/i).first().fill(input.contactNumber);
    await this.page.getByLabel(/company description/i).fill(input.companyDescription);

    await this.pickReactSelect(/salutation/i, input.participantSalutation);
    await this.page.getByLabel(/first name/i).fill(input.participantFirstName);
    await this.page.getByLabel(/last name/i).fill(input.participantLastName);
    await this.page.getByLabel(/contact email/i).fill(input.participantEmail);
    await this.page.getByLabel(/contact number/i).last().fill(input.participantContactNumber);
    await this.page.getByLabel(/primary/i).check();

    await this.page.getByRole('button', { name: /^save$|^create$/i }).click();
  }

  row(companyName: string) {
    return this.page.getByRole('row', { name: new RegExp(companyName) });
  }

  /** Own aria-label is "Set delegate active" - same label the top-bar organizer-delegate-mode toggle uses. Scope to the row. */
  async toggleStatus(companyName: string) {
    await this.row(companyName).getByRole('button', { name: 'Set delegate active' }).click();
  }

  /** Bulk path: select-all checkbox is role=checkbox (not a native input), then a SECOND confirmation modal is required. */
  async bulkActivateAll() {
    await this.page.getByRole('checkbox', { name: /select all/i }).check();
    await this.page.getByRole('button', { name: /activate all/i }).click();
    const dialog = dialogScope(this.page);
    await dialog.getByRole('button', { name: /activate \d+ delegates?/i }).click();
    await expect(this.page.locator('body')).toContainText(/delegates? activated successfully/i, { timeout: 15_000 });
  }

  async resendLink(companyName: string) {
    await this.row(companyName).getByRole('button', { name: /resend link/i }).click();
    const dialog = dialogScope(this.page);
    await dialog.getByRole('button', { name: /resend/i }).click();
  }
}
