import { Page, expect } from '@playwright/test';

/**
 * Delegate-side "Delegates" directory (/delegate/<slug>/delegates).
 * Confirmed live 2026-08-12: the free-text search box does NOT live-filter as you type -
 * you must click "Apply Filters" to actually run the search. Typing alone fires no request.
 */
export class DelegateDirectoryPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a, button').filter({ hasText: /^Delegates$/ }).first().click();
    await expect(this.page.getByPlaceholder('Name, company, email...')).toBeVisible();
  }

  searchInput() {
    return this.page.getByPlaceholder('Name, company, email...');
  }

  async searchAndApply(query: string) {
    await this.searchInput().fill(query);
    await this.page.getByRole('button', { name: /apply filters/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async resetFilters() {
    await this.page.getByRole('button', { name: /^reset$/i }).click();
    await this.page.waitForTimeout(1000);
  }

  rows() {
    return this.page.getByRole('row');
  }

  emptyState() {
    return this.page.getByText(/no delegates found/i).first();
  }
}
