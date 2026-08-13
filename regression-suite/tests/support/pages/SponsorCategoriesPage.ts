import { Page, expect } from '@playwright/test';
import { dialogScope, isSwitchOn } from '../utils';

export class SponsorCategoriesPage {
  constructor(private readonly page: Page) {}

  /** Route /organizer/sponsor-categories (hyphenated). Direct sub-route goto('/add') is unreliable - always click through. */
  async goto() {
    await this.page.locator('a:has-text("Sponsor Categories")').click();
    await expect(this.page).toHaveURL(/\/organizer\/sponsor-categories/);
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: /add sponsor category/i }).click();
  }

  /** react-select keeps the selected value visible as a single-value node while the list is open - a bare text locator matches two nodes. Always use role=option. */
  private async pickReactSelect(labelText: RegExp, optionText: string) {
    await this.page.getByText(labelText).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async selectHierarchy(value: string) {
    await this.pickReactSelect(/hierarchy/i, value);
  }

  async selectDisplay(value: string) {
    await this.pickReactSelect(/display/i, value);
  }

  /** Label copy changed from "Name" to "Category Name" sometime after 2026-08-09 - match either. */
  async fillName(name: string) {
    await this.page.getByLabel(/^(category )?name$/i).fill(name);
  }

  /** Button copy changed to "Add Sponsor Category" sometime after 2026-08-09 - match old and new labels. */
  async save() {
    await this.page.getByRole('button', { name: /^save$|^create$|^add sponsor category$/i }).click();
  }

  row(name: string) {
    return this.page.getByRole('row', { name: new RegExp(name) });
  }

  /** Not an instant flip - opens a confirm modal ("Enable/Disable Promote..."). */
  async togglePromote(name: string) {
    await this.row(name).locator('[role="switch"], [aria-checked]').click();
    const dialog = dialogScope(this.page);
    await dialog.getByRole('button', { name: /promote/i }).click();
  }

  async isPromoted(name: string): Promise<boolean> {
    return isSwitchOn(this.row(name).locator('[role="switch"], [aria-checked]').first());
  }

  /** Row-level Delete needs dialog-scoping - a bare "Delete" button matches the dialog AND every other row's inline action. */
  async deleteCategory(name: string) {
    await this.row(name).getByRole('button', { name: /delete/i }).click();
    const dialog = dialogScope(this.page);
    await dialog.getByRole('button', { name: /delete/i }).click();
  }

  async countRowsNamed(name: string): Promise<number> {
    return this.row(name).count();
  }
}
