import { Page, expect } from '@playwright/test';

export class AccessTypesPage {
  constructor(private readonly page: Page) {}

  /** Route is /organizer/access-types (hyphenated) - a guessed camelCase URL silently redirects to Profile. Always navigate via sidebar. */
  async goto() {
    await this.page.locator('a:has-text("Access Types")').click();
    await expect(this.page).toHaveURL(/\/organizer\/access-types/);
  }

  /** Button copy changed to "Add Access Type" sometime after 2026-08-12 - match old and new labels. */
  async openAddForm() {
    await this.page.getByRole('button', { name: /^add new$|^add access type$/i }).click();
  }

  /** Type changed from a react-select dropdown to plain radio buttons (confirmed live 2026-08-15) - "Individual" is checked by default. */
  async selectType(type: 'Individual' | 'Shared') {
    await this.page.getByRole('radio', { name: type }).check();
  }

  /**
   * Not a real <label> association (confirmed live 2026-08-15) - the "Max Participants *" text
   * is an unassociated sibling, so the field's only accessible name comes from its placeholder.
   * getByLabel never matches it; use the role/name (== placeholder) instead.
   */
  maxParticipantsField() {
    return this.page.getByRole('spinbutton', { name: /max participants/i });
  }

  /** Individual auto-fills 1 and disables the field - by design, not a bug. Any Max-Participants value test must select Shared first. */
  async isMaxParticipantsDisabled(): Promise<boolean> {
    return this.maxParticipantsField().isDisabled();
  }

  async fillName(name: string) {
    await this.page.getByLabel(/^name$/i).fill(name);
  }

  /** Button copy changed to "Create Access Type" sometime after 2026-08-12 - match old and new labels. */
  saveButton() {
    return this.page.getByRole('button', { name: /^save$|^create$|^create access type$/i });
  }

  async save() {
    await this.saveButton().click();
  }
}
