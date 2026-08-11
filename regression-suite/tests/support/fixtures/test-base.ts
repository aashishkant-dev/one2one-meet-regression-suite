import { test as base, Page } from '@playwright/test';
import { env } from '../env';
import { OrganizerNav } from '../pages/OrganizerNav';
import { DelegateAuthPage } from '../pages/DelegateAuthPage';

type Fixtures = {
  /** Fresh page, already logged in as the QA E2E staging organizer. */
  organizerPage: Page;
  /** Fresh page, already logged in as staging Super Admin. */
  superAdminPage: Page;
  /** Fresh page, already logged in as Booking Test Event delegate A (alex). */
  bookingDelegateAPage: Page;
  /** Fresh page, already logged in as Booking Test Event delegate B (blake). */
  bookingDelegateBPage: Page;
};

export const test = base.extend<Fixtures>({
  organizerPage: async ({ page }, use) => {
    await new OrganizerNav(page).login(env.orgUsername, env.orgPassword);
    await use(page);
  },

  superAdminPage: async ({ page }, use) => {
    await new OrganizerNav(page).loginSuperAdmin(env.superAdminUsername, env.superAdminPassword);
    await use(page);
  },

  bookingDelegateAPage: async ({ page }, use) => {
    const auth = new DelegateAuthPage(page);
    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await auth.expectLoggedIn();
    await use(page);
  },

  bookingDelegateBPage: async ({ page }, use) => {
    const auth = new DelegateAuthPage(page);
    await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    await auth.expectLoggedIn();
    await use(page);
  },
});

export { expect } from '@playwright/test';
