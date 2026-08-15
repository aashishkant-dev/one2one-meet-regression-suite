import { Page, Locator, expect } from '@playwright/test';
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

  /**
   * .first() matters: the Access Type label text now also matches inside the Country field's
   * rendered markup, so an unscoped getByText resolves to 2 elements (strict-mode violation) -
   * confirmed live, this was silently broken since the 2026-08-12 gap sweep until fixed here.
   *
   * The option click is scoped to the react-select__option CSS class (matching EventsPage's
   * private pickReactSelect), not a bare getByRole('option') - the page also has 2 native
   * <select> phone-country-code widgets whose <option> elements (e.g. "Nepal") are always in
   * the DOM regardless of open state, so an unscoped role locator resolves to 3 elements.
   */
  private async pickReactSelect(labelText: RegExp, optionText: string) {
    await this.page.getByText(labelText).first().locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.locator('.react-select__option', { hasText: optionText }).first().click();
  }

  /** phoneNumber must include a leading "+<countrycode>" - see the call site comment. */
  private async fillPhoneNumber(field: Locator, phoneNumber: string) {
    await field.click();
    await field.fill('');
    await field.pressSequentially(phoneNumber, { delay: 30 });
  }

  /** TC-DM-001: create with primary participant. Delegate lands inactive by default - must Activate before any credential-email test. */
  async createDelegate(input: NewDelegateInput) {
    await this.openAddForm();
    await this.page.getByLabel(/company name/i).fill(input.companyName);
    await this.page.getByLabel(/company email/i).fill(input.companyEmail);
    await this.pickReactSelect(/access type/i, input.accessType);
    // Label changed to plural "Countries" sometime after 2026-08-12 - match old and new wording.
    await this.pickReactSelect(/^countr(y|ies)/i, input.country);
    // Label changed to plural "Cities" sometime after 2026-08-12 - match old and new wording.
    await this.pickReactSelect(/^cit(y|ies)/i, input.city);
    // Same auto-country-detect phone widget as EventsPage's Event Contact Number (confirmed
    // live 2026-08-15) - a plain .fill() mis-parses into the wrong country code. Needs real
    // keystrokes and a leading "+<countrycode>" (see EventsPage.createEvent()'s comment).
    // Neither Contact Number field (company or participant) has a real <label> - both share
    // the placeholder "Enter contact number", hence first()/last() below.
    await this.fillPhoneNumber(this.page.getByPlaceholder(/enter contact number/i).first(), input.contactNumber);
    await this.page.getByLabel(/company description/i).fill(input.companyDescription);

    // The whole Participant Information section has no real <label> associations (confirmed
    // live 2026-08-15) - every field's accessible name is its placeholder instead.
    await this.page.getByPlaceholder(/mr\.\/mrs\.\/ms\.\/dr\./i).fill(input.participantSalutation);
    await this.page.getByPlaceholder(/enter first name/i).fill(input.participantFirstName);
    await this.page.getByPlaceholder(/enter last name/i).fill(input.participantLastName);
    await this.page.getByPlaceholder(/enter contact email/i).fill(input.participantEmail);
    await this.fillPhoneNumber(this.page.getByPlaceholder(/enter contact number/i).last(), input.participantContactNumber);
    await this.page.getByLabel(/primary/i).check();

    // Button copy is "Create Delegate" (confirmed live 2026-08-15) - match old and new labels.
    await this.page.getByRole('button', { name: /^save$|^create$|^create delegate$/i }).click();
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
