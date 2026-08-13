import { Page, expect } from '@playwright/test';

/**
 * Meeting/Notification/2FA settings - all one long form on /organizer/settings, reached via
 * OrganizerNav.openMeetingSettings(), submitted together via the single 'Update Profile' button
 * (OrganizerNav.saveSettings()). Confirmed live 2026-08-12.
 */
export class MeetingSettingsPage {
  constructor(private readonly page: Page) {}

  numberField(label: string) {
    return this.page.getByText(label, { exact: false }).locator('xpath=following::input[@type="number"][1]');
  }

  toggle(label: string) {
    return this.page.getByText(label, { exact: false }).locator('xpath=following::input[@type="checkbox"][1]');
  }

  /**
   * This custom stepper input's minus key is swallowed by the browser's native number-input
   * keydown handling AND plain .fill()/pressSequentially() don't reliably flip React's
   * dirty-state. Set the value via the native input value setter + a real 'input' event,
   * which the framework's onChange listens to directly - reliable for negative values too.
   */
  async setNumberField(label: string, value: number | string) {
    const field = this.numberField(label);
    await field.evaluate((el: HTMLInputElement, v: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, String(value));
    await field.press('Tab');
  }

  async setToggle(label: string, on: boolean) {
    const field = this.toggle(label);
    const isChecked = await field.isChecked();
    if (isChecked !== on) {
      await field.click({ force: true });
    }
  }
}
