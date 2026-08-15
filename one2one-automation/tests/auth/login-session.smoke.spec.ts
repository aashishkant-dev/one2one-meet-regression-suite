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
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test('TC-LS-014b unauthenticated direct access to /super-admin/dashboard redirects to login', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test('TC-SA-001 Super Admin logs in with valid credentials', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(page);
    await nav.loginSuperAdmin(env.superAdminUsername, env.superAdminPassword);
    await expect(page.getByRole('link', { name: 'Event Organizers' })).toBeVisible();
  });

  test('TC-SA-N01 Super Admin login fails with an invalid password', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    await page.goto('/auth/login');
    await page.locator('#username').fill(env.superAdminUsername);
    await page.locator('#password').fill('definitely-wrong-password');
    await page.getByRole('button', { name: /log ?in/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/invalid|not found|incorrect/i)).toBeVisible();
  });

  test('TC-LS-012 + TC-LS-004 session token portability and cross-context logout invalidation', async ({ page, browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(page);
    await nav.login(env.orgUsername, env.orgPassword);

    const context = page.context();
    const cookies = await context.cookies();
    const refreshToken = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshToken, 'expected an httpOnly refreshToken cookie after login').toBeTruthy();

    const clonedContext = await browser.newContext();
    await clonedContext.addCookies(cookies);
    const clonedPage = await clonedContext.newPage();
    await clonedPage.goto('/organizer/dashboard');
    await expect(clonedPage).toHaveURL(/\/organizer\/dashboard/);

    await nav.logout();
    await clonedPage.reload();
    await expect(clonedPage).toHaveURL(/\/auth\/login/, { timeout: 15_000 });

    await clonedContext.close();
  });

  test('TC-DL-001 delegate logs in at the event slug login widget', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const auth = new DelegateAuthPage(page);
    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await auth.expectLoggedIn();
  });

  test('TC-DL-N01 delegate login with wrong password is rejected with a clear error', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const auth = new DelegateAuthPage(page);
    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, 'definitely-wrong-password');
    await auth.expectInvalidLoginError();
  });

  test('TC-DL-N02 delegate login with non-existent username is rejected', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const auth = new DelegateAuthPage(page);
    await auth.login(env.bookingEventSlug, `nonexistent-${Date.now()}`, 'whatever-password');
    await auth.expectInvalidLoginError();
  });
});
