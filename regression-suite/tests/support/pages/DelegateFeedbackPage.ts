import { Page, expect } from '@playwright/test';

/** Delegate-side Feedback page (/delegate/<slug>/feedbacks). Confirmed live 2026-08-12. */
export class DelegateFeedbackPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.locator('a, button').filter({ hasText: /^Feedbacks$/ }).first().click();
    await expect(this.page.getByRole('button', { name: /submit feedback/i })).toBeVisible();
  }

  async submit({ type, subject, comment }: { type: string; subject: string; comment: string }) {
    await this.page.getByRole('button', { name: /submit feedback/i }).click();
    const dialog = this.page.locator('[role="dialog"], [role="alertdialog"]');
    await dialog.getByText(/^feedback type/i).locator('xpath=following::div[contains(@class,"react-select__control")][1]').click();
    await this.page.getByRole('option', { name: type, exact: false }).click();
    await dialog.getByPlaceholder('Enter feedback subject').fill(subject);
    await dialog.getByPlaceholder('Describe your feedback...').fill(comment);
    await dialog.getByRole('button', { name: /^submit$/i }).click();
  }

  row(subject: string) {
    return this.page.getByRole('row', { name: new RegExp(subject) });
  }
}
