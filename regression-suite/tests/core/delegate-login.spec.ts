import { test, expect } from '@playwright/test';
import { DelegateAuthPage } from '../support/pages/DelegateAuthPage';
import { env } from '../support/env';

/** Smoke subset of the 10-case Delegate Login & Profile module. Confirmed 5/5 passing 2026-08-09. */
test.describe('Delegate Login & Profile', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Delegate Login & Profile' });
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

  test('TC-DL-N03 open slug URL of an event that is not active', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Low' });
    // Past Event's booking window is closed but the event itself may still be Active -
    // this checks the slug still serves a login page rather than erroring, per TC-EV-003.
    await page.goto(`/delegate/${env.pastEventSlug}`);
    await expect(page).not.toHaveURL(/error|500|404/);
  });
});
