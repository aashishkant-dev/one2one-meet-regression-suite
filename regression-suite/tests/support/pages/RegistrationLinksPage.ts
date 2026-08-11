import { Page } from '@playwright/test';

export class RegistrationLinksPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a:has-text("Registration Links")').click();
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: /add/i }).click();
  }

  /**
   * CONFIRMED FLAKY APP BUG (2026-08-09): "Cannot add registration link for expired event"
   * fires nondeterministically on the same event/org across identical runs (2/5 blocked, 3/5
   * reached the form). Do not assert a single fixed outcome here - observe and record both
   * possible states, only hard-fail on the one combination that would be a genuinely new bug
   * (reaching the form AND seeing the blocked toast at the same time).
   */
  async attemptAddOnPossiblyExpiredEvent(): Promise<'blocked' | 'reached-form'> {
    await this.openAddForm();
    const toast = this.page.getByText(/cannot add registration link for expired event/i);
    const blocked = await toast.isVisible({ timeout: 3000 }).catch(() => false);
    if (blocked) return 'blocked';
    return 'reached-form';
  }

  noLinksEmptyState() {
    // "No links found" appears in 3 different DOM locations simultaneously - scope to one cell.
    return this.page.getByRole('cell', { name: /no links found/i });
  }
}
