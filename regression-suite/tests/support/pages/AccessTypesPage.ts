import { Page, expect } from '@playwright/test';

export class AccessTypesPage {
  constructor(private readonly page: Page) {}

  /** Route is /organizer/access-types (hyphenated) - a guessed camelCase URL silently redirects to Profile. Always navigate via sidebar. */
  async goto() {
    await this.page.locator('a:has-text("Access Types")').click();
    await expect(this.page).toHaveURL(/\/organizer\/access-types/);
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: /add new/i }).click();
  }

  async selectType(type: 'Individual' | 'Shared') {
    await this.page.getByText(/^type$/i).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: type, exact: true }).click();
  }

  maxParticipantsField() {
    return this.page.getByLabel(/max participants?/i);
  }

  /** Individual auto-fills 1 and disables the field - by design, not a bug. Any Max-Participants value test must select Shared first. */
  async isMaxParticipantsDisabled(): Promise<boolean> {
    return this.maxParticipantsField().isDisabled();
  }

  async fillName(name: string) {
    await this.page.getByLabel(/^name$/i).fill(name);
  }

  saveButton() {
    return this.page.getByRole('button', { name: /^save$|^create$/i });
  }

  async save() {
    await this.saveButton().click();
  }
}
