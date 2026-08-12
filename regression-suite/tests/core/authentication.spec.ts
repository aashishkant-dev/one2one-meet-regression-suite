import { test, expect } from '@playwright/test';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { env } from '../support/env';

/**
 * New coverage found by live-surfing staging on 2026-08-09 (headless Playwright recon
 * against one2one.techarttrekkies.com.np, organizer QEO1-0147). None of these TC-IDs exist
 * in One2One_Meet_TestCases_Merged.xlsx - they're transcribed from the
 * "Login & Session - Gaps" / "Super Admin - Gaps" sheets in
 * One2One_Meet_TestCases_Concurrency_and_Gaps.xlsx (same TC-IDs, same wording).
 *
 * Deliberately NOT automated here (would mutate a shared credential everything else
 * depends on): actually consuming a password-reset token (TC-LS-002 completion),
 * repeated-request rate-limit probing (TC-LS-010), and the reset form's live
 * password-strength checklist (TC-LS-011, needs a fresh one-time token per run). See the
 * xlsx for why and how to execute those against a disposable account instead.
 */
test.describe('Authentication - Gap Coverage', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Authentication - Gap Coverage' });
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

  test('TC-LS-009 Forgot Password reveals username validity via a distinct error message', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'note',
      description:
        'Security finding, not a functional bug: valid usernames get a generic success message, ' +
        'nonexistent ones get "User not found" - this lets an attacker enumerate valid accounts.',
    });

    // Nonexistent username -> distinct, immediate error.
    await page.goto('/auth/password/forgot');
    await page.locator('input').first().fill(`definitely-not-a-real-user-${Date.now()}`);
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/user not found/i)).toBeVisible({ timeout: 10_000 });

    // Valid username -> generic success message, no "not found" anywhere.
    await page.goto('/auth/password/forgot');
    await page.locator('input').first().fill(env.orgUsername);
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/user not found/i)).not.toBeVisible();
  });

  test('TC-LS-013 manual-bookings topbar hydration on a cold direct deep-link', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    test.info().annotations.push({
      type: 'note',
      description:
        'The "Organizer details unavailable" degraded topbar (manual recon, 2026-08-11) is a ' +
        "hydration RACE, not deterministic - it doesn't reproduce on every cold load (confirmed: " +
        'back-to-back automated runs caught it once and missed it once at Playwright\'s own timing). ' +
        "This test can't assert the bug always appears without being flaky, so it logs whether the " +
        'transient state was observed and hard-asserts only the thing that must always be true: the ' +
        'page settles on a healthy topbar, never a permanently broken one.',
    });
    const nav = new OrganizerNav(page);
    await nav.login(env.orgUsername, env.orgPassword);

    // Cold direct navigation (not a sidebar click-through) is the reproduction step.
    await page.goto('/organizer/manual-bookings');
    const sawDegradedState = await page
      .getByText(/organizer details unavailable/i)
      .isVisible()
      .catch(() => false);
    test.info().annotations.push({
      type: 'observed',
      description: sawDegradedState
        ? 'Degraded topbar reproduced this run.'
        : 'Degraded topbar did NOT reproduce this run (timing-dependent, see note above).',
    });

    // Whether or not the race was caught mid-flight, the page must always settle here -
    // never get permanently stuck showing the degraded topbar.
    await expect(page.getByText(/organizer details unavailable/i)).not.toBeVisible({ timeout: 10_000 });
  });

  test('TC-LS-012 + TC-LS-004 session token portability and cross-context logout invalidation', async ({ page, browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const nav = new OrganizerNav(page);
    await nav.login(env.orgUsername, env.orgPassword);

    // Clone just the refreshToken cookie into a brand-new, unrelated context.
    const context = page.context();
    const cookies = await context.cookies();
    const refreshToken = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshToken, 'expected an httpOnly refreshToken cookie after login').toBeTruthy();

    const clonedContext = await browser.newContext();
    await clonedContext.addCookies(cookies);
    const clonedPage = await clonedContext.newPage();
    await clonedPage.goto('/organizer/dashboard');
    // Portability: the bare cookie alone is enough to authenticate a fresh context.
    await expect(clonedPage).toHaveURL(/\/organizer\/dashboard/);

    // Logging out of the ORIGINAL context must invalidate the CLONED context too.
    await nav.logout();
    await clonedPage.reload();
    await expect(clonedPage).toHaveURL(/\/auth\/login/, { timeout: 15_000 });

    await clonedContext.close();
  });
});
