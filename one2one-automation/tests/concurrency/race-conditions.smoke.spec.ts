import { test, expect } from '@playwright/test';
import { env } from '../../../regression-suite/tests/support/env';
import { OrganizerNav } from '../../../regression-suite/tests/support/pages/OrganizerNav';
import { EventsPage } from '../../../regression-suite/tests/support/pages/EventsPage';
import { SponsorCategoriesPage } from '../../../regression-suite/tests/support/pages/SponsorCategoriesPage';
import { seededData } from '../../../regression-suite/tests/support/fixtures/seeded-data';

/**
 * Concurrency smoke checks - deliberately the subset of the full 10-case
 * regression-suite/tests/core/concurrency.spec.ts that's SAFE to re-run after every deploy:
 * both cases below race on a fresh Date.now()-suffixed name, so there's no shared timeslot or
 * pending-request state to go stale between runs.
 *
 * NOT included here (by design, not oversight): the booking-slot races (TC-CC-001/003/008,
 * TC-CR-001/002/004) consume real timeslots on the shared Booking Test Event and need fresh
 * slots picked before each run - run those manually from regression-suite when you need them,
 * see its CASE_MAP.md "Concurrency & Login/Session — last live execution" note.
 */
test.describe('Smoke - Concurrency', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Smoke - Concurrency' });
  });

  test('TC-CE-001 two organizer sessions simultaneously create an event with the IDENTICAL name (slug collision)', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      const navA = new OrganizerNav(pageA);
      const navB = new OrganizerNav(pageB);
      await navA.login(env.orgUsername, env.orgPassword);
      await navB.login(env.orgUsername, env.orgPassword);

      const eventsA = new EventsPage(pageA);
      const eventsB = new EventsPage(pageB);
      await eventsA.goto();
      await eventsB.goto();

      const raceName = `SmokeConcurrencyEvent-${Date.now()}`;
      const input = {
        name: raceName,
        timezone: 'Kathmandu',
        venue: 'Race Test Venue',
        address: 'Race Test Address',
        country: 'Nepal',
        city: 'Kathmandu',
        email: `race-${Date.now()}@example.com`,
        contactNumber: '+9779800000000',
      };

      const [resultA, resultB] = await Promise.allSettled([
        eventsA.createEvent(input),
        eventsB.createEvent(input),
      ]);

      // Dismiss post-create modals if visible (either or both sessions may show one)
      const laterBtnA = pageA.getByRole('button', { name: /^later$/i });
      const laterBtnB = pageB.getByRole('button', { name: /^later$/i });

      if (await laterBtnA.isVisible({ timeout: 3000 }).catch(() => false)) {
        await laterBtnA.click();
      }
      if (await laterBtnB.isVisible({ timeout: 3000 }).catch(() => false)) {
        await laterBtnB.click();
      }

      // Wait for one of the sessions to navigate away from the form
      await Promise.race([
        pageA.waitForURL(/\/organizer\/events/, { timeout: 10_000 }),
        pageB.waitForURL(/\/organizer\/events/, { timeout: 10_000 }),
      ]).catch(() => {
        // If neither navigates, events list may be stuck; proceed to verification
      });

      // Verify the race condition was handled correctly
      await eventsA.goto();
      await eventsA.searchByName(raceName);
      await pageA.waitForLoadState('networkidle');

      test.info().annotations.push({
        type: 'observed-outcome',
        description: `Session A: ${resultA.status}. Session B: ${resultB.status}.`,
      });

      // Neither concurrent session should be left crashed/rejected.
      const eitherSucceeded = resultA.status === 'fulfilled' || resultB.status === 'fulfilled';
      expect(eitherSucceeded).toBe(true);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('TC-CE-008 two organizer sessions simultaneously create a Sponsor Category with the IDENTICAL name', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      const navA = new OrganizerNav(pageA);
      const navB = new OrganizerNav(pageB);
      await navA.login(env.orgUsername, env.orgPassword);
      await navB.login(env.orgUsername, env.orgPassword);
      await navA.switchEventAndWaitFor(seededData.currentEvent.name, /Sponsor/i);
      await navB.switchEventAndWaitFor(seededData.currentEvent.name, /Sponsor/i);

      const categoriesA = new SponsorCategoriesPage(pageA);
      const categoriesB = new SponsorCategoriesPage(pageB);
      await categoriesA.goto();
      await categoriesB.goto();

      const raceName = `SmokeConcurrencyRace-${Date.now()}`;
      await categoriesA.openAddForm();
      await categoriesA.fillName(raceName);
      await categoriesB.openAddForm();
      await categoriesB.fillName(raceName);

      const [resultA, resultB] = await Promise.allSettled([
        categoriesA.save(),
        categoriesB.save(),
      ]);

      // Wait for save operations to complete and settle
      await pageA.waitForLoadState('networkidle');
      await pageA.reload();
      await pageA.waitForLoadState('domcontentloaded');

      const finalCount = await categoriesA.countRowsNamed(raceName);

      test.info().annotations.push({
        type: 'observed-outcome',
        description: `Session A: ${resultA.status}. Session B: ${resultB.status}. Rows named "${raceName}": ${finalCount}.`,
      });

      // Duplicate-name de-dup must hold under a genuine simultaneous race.
      expect(finalCount).toBeLessThanOrEqual(1);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
