import { test, expect } from '@playwright/test';
import { OrganizerNav } from '../../../regression-suite/tests/support/pages/OrganizerNav';
import { DelegateAuthPage } from '../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { env } from '../../../regression-suite/tests/support/env';

/**
 * Auth & Session smoke checks - safe to re-run after every deploy, no shared fixture state
 * consumed. Reuses the Page Objects from ../../../regression-suite (single source of truth
 * for selectors/gotchas) so this suite never drifts from what's actually verified against
 * the live app.
 */
test.describe('Smoke - Auth & Session', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Smoke - Auth & Session' });
  });

  test('TC-LS-014a unauthenticated direct access to /organizer/dashboard redirects to login', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    await page.goto('/organizer/dashboard');

    // Verify unauthenticated access is redirected to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test('TC-LS-012 + TC-LS-004 session token portability and cross-context logout invalidation', async ({ page, browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(page);
    await nav.login(env.orgUsername, env.orgPassword);

    // Verify session token is properly issued
    const context = page.context();
    const cookies = await context.cookies();
    const refreshToken = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshToken, 'refreshToken should be present after successful login').toBeTruthy();

    // Create a cloned context with the same session cookies
    const clonedContext = await browser.newContext();
    try {
      await clonedContext.addCookies(cookies);
      const clonedPage = await clonedContext.newPage();
      await clonedPage.goto('/organizer/dashboard');

      // Verify the cloned session can access protected pages
      await expect(clonedPage).toHaveURL(/\/organizer\/dashboard/, { timeout: 10_000 });

      // Logout from the original session
      await nav.logout();

      // Verify logout invalidates the cloned session
      await clonedPage.reload();
      await expect(clonedPage).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    } finally {
      await clonedContext.close();
    }
  });

  test('TC-DL-001 delegate logs in at the event slug login widget', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const auth = new DelegateAuthPage(page);

    await auth.login(
      env.bookingEventSlug,
      env.bookingDelegateAUsername,
      env.bookingDelegateAPassword
    );
    await auth.expectLoggedIn({ timeout: 10_000 });
  });

  test('TC-DL-N01 delegate login with wrong password is rejected with a clear error', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const auth = new DelegateAuthPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, 'wrong-password');
    await auth.expectInvalidLoginError({ timeout: 10_000 });
  });

  test('TC-DL-N02 delegate login with non-existent username is rejected', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const auth = new DelegateAuthPage(page);

    await auth.login(
      env.bookingEventSlug,
      `nonexistent-user-${Date.now()}`,
      'some-password'
    );
    await auth.expectInvalidLoginError({ timeout: 10_000 });
  });
});
