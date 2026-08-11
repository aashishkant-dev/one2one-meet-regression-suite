import { Page, Locator } from '@playwright/test';

/**
 * react-datepicker renders greyed-out days from adjacent months in the same grid
 * (aria-disabled="true", class includes --outside-month/--disabled). A naive
 * getByText(day) can match both the real day and a disabled adjacent-month day
 * sharing the same number - scope to the zero-padded day class and exclude both
 * disabled states. Confirmed on Add/Edit Event; same component elsewhere a date
 * range appears (Registration Links expiry, Agenda).
 */
export function reactDatepickerDay(container: Locator | Page, day: number): Locator {
  const padded = String(day).padStart(2, '0');
  return container.locator(
    `.react-datepicker__day--${padded}:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--disabled)`
  );
}

/** This app's switch widgets are `<div role="switch" aria-checked="...">`, not native inputs - isChecked() times out. */
export async function isSwitchOn(locator: Locator): Promise<boolean> {
  return (await locator.getAttribute('aria-checked')) === 'true';
}

/** Scope any confirm-dialog button lookup to the open dialog - bare text buttons collide with row-level actions of the same name. */
export function dialogScope(page: Page): Locator {
  return page.locator('[role="dialog"], [role="alertdialog"]');
}
