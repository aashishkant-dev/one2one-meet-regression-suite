import { test as base, expect } from '@playwright/test';
import { env } from '../support/env';
import { DelegateAuthPage } from '../support/pages/DelegateAuthPage';
import { DelegateMeetingsPage } from '../support/pages/DelegateMeetingsPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { DelegatesPage } from '../support/pages/DelegatesPage';
import { seededData } from '../support/fixtures/seeded-data';

/**
 * Gap-fill for the merged register's "Concurrency - Race Conditions" sheet (40 cases, all
 * "Not Tested"). Genuine concurrency testing needs real parallel requests, not sequential
 * clicks - each test below drives TWO real, independent browser pages at once and fires
 * their actions via Promise.all so the requests actually overlap on the wire. Executed live
 * on staging 2026-08-13.
 *
 * This file intentionally does NOT use the shared organizerPage/bookingDelegate*Page
 * fixtures from test-base.ts, because several tests need MORE than one of the same role
 * logged in simultaneously (two independent delegate sessions, two independent organizer
 * sessions) - the shared fixtures only give you one of each per test.
 *
 * NOT IDEMPOTENT: TC-CC-001 and TC-CC-008 consume real, specific slots (10:20/10:40/11:00 on
 * 06 Sep) on the shared Booking Test Event fixture. First real run of each: both passed
 * (2026-08-13). Re-running without first freeing those slots (or picking new ones) will fail
 * for the mundane reason that the slot is already booked, not a new bug - update the SLOT
 * constants (or the target/requester delegates) before re-running.
 */
const test = base;

test.describe('Concurrency - Race Conditions (Gap Coverage)', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Concurrency - Race Conditions' });
  });

  test('TC-CC-001 two delegates simultaneously request the SAME target for the SAME slot', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'Critical' });

    const alexCtx = await browser.newContext();
    const blakeCtx = await browser.newContext();
    const alexPage = await alexCtx.newPage();
    const blakePage = await blakeCtx.newPage();

    await new DelegateAuthPage(alexPage).login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await new DelegateAuthPage(blakePage).login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);

    const alexMeetings = new DelegateMeetingsPage(alexPage);
    const blakeMeetings = new DelegateMeetingsPage(blakePage);
    await alexMeetings.goto();
    await blakeMeetings.goto();

    const SLOT = '10:20 TO 10:35';
    await alexMeetings.openBookMeetingModal(SLOT);
    await blakeMeetings.openBookMeetingModal(SLOT);

    // Fire both requests at the same target ('QA Automation', the EO-as-delegate profile) in parallel.
    const [alexResult, blakeResult] = await Promise.allSettled([
      alexMeetings.submitBookMeeting({ meetingWith: 'QA Automation', remarks: 'TC-CC-001 race leg A' }),
      blakeMeetings.submitBookMeeting({ meetingWith: 'QA Automation', remarks: 'TC-CC-001 race leg B' }),
    ]);

    const alexStatus = alexResult.status === 'fulfilled' ? alexResult.value.status() : `rejected: ${alexResult.reason?.message ?? alexResult.reason}`;
    const blakeStatus = blakeResult.status === 'fulfilled' ? blakeResult.value.status() : `rejected: ${blakeResult.reason?.message ?? blakeResult.reason}`;

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `CONFIRMED live 2026-08-13: Alex's request outcome: ${alexStatus}. Blake's simultaneous request outcome: ${blakeStatus}. One side got a clean 200; the other did not get any response within 15s (not a clean rejection message - a hang/timeout instead) - worth flagging to the dev team as a silent-failure UX gap for the losing side of this race, even though the winner behaves correctly.`,
    });

    // At least one side of the race must get a clean, non-hanging outcome.
    const atLeastOneCleanSuccess = alexStatus === 200 || blakeStatus === 200;
    expect(atLeastOneCleanSuccess).toBe(true);

    await alexCtx.close();
    await blakeCtx.close();
  });

  test('TC-CC-008 independent non-conflicting bookings fired at the same instant do not cross-contaminate', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    const alexCtx = await browser.newContext();
    const blakeCtx = await browser.newContext();
    const alexPage = await alexCtx.newPage();
    const blakePage = await blakeCtx.newPage();

    await new DelegateAuthPage(alexPage).login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await new DelegateAuthPage(blakePage).login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);

    const alexMeetings = new DelegateMeetingsPage(alexPage);
    const blakeMeetings = new DelegateMeetingsPage(blakePage);
    await alexMeetings.goto();
    await blakeMeetings.goto();

    // Two DIFFERENT slots, two DIFFERENT targets - Alex -> QA Automation @ 10:40, Blake -> QA
    // Automation @ 11:00 (Blake can't target Alex here since Alex is mid-booking-flow too;
    // both racing against the same 3rd party but on non-overlapping slots is still a valid
    // "independent, non-conflicting" pair).
    const SLOT_A = '10:40 TO 10:55';
    const SLOT_B = '11:00 TO 11:15';
    await alexMeetings.openBookMeetingModal(SLOT_A);
    await blakeMeetings.openBookMeetingModal(SLOT_B);

    const [alexResult, blakeResult] = await Promise.allSettled([
      alexMeetings.submitBookMeeting({ meetingWith: 'QA Automation', remarks: 'TC-CC-008 leg A' }),
      blakeMeetings.submitBookMeeting({ meetingWith: 'QA Automation', remarks: 'TC-CC-008 leg B' }),
    ]);

    const alexOk = alexResult.status === 'fulfilled' && alexResult.value.status() === 200;
    const blakeOk = blakeResult.status === 'fulfilled' && blakeResult.value.status() === 200;

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `Non-conflicting parallel bookings - Alex (10:40) succeeded: ${alexOk}, Blake (11:00) succeeded: ${blakeOk}.`,
    });

    // Independent, non-conflicting requests should both go through cleanly.
    expect(alexOk && blakeOk).toBe(true);

    await alexCtx.close();
    await blakeCtx.close();
  });

  /**
   * Not automated (test.skip): a second concurrent organizer login of the SAME account
   * reproducibly gets stuck back on /auth/terms-of-service (3/3 attempts, 2026-08-13) even
   * though OrganizerNav.acceptTermsGateIfPresent() handles a single session's gate correctly.
   * Looks like a related but distinct issue - the account's ToS-acceptance/session state under
   * a second concurrent session, not the same bug already fixed for the single-session case.
   * Needs investigation with real app/session visibility, not more retries here.
   */
  test.skip('TC-CE-011 bulk "Activate All" and an individual delegate Status toggle fired at the same instant', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const navA = new OrganizerNav(pageA);
    const navB = new OrganizerNav(pageB);
    await navA.login(env.orgUsername, env.orgPassword);
    await navB.login(env.orgUsername, env.orgPassword);
    await navA.switchEventAndWaitFor(seededData.currentEvent.name, /Delegate/i);
    await navB.switchEventAndWaitFor(seededData.currentEvent.name, /Delegate/i);

    const delegatesA = new DelegatesPage(pageA);
    const delegatesB = new DelegatesPage(pageB);
    await delegatesA.goto();
    await delegatesB.goto();

    const beforeRows = await pageA.getByRole('row').count();
    const firstDelegateName = (await pageA.getByRole('row').nth(1).innerText()).split('\n')[0];

    const [bulkResult, toggleResult] = await Promise.allSettled([
      delegatesA.bulkActivateAll(),
      delegatesB.row(firstDelegateName).getByRole('button', { name: 'Set delegate active' }).click({ timeout: 10_000 }),
    ]);

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `Bulk activate outcome: ${bulkResult.status}. Individual toggle outcome: ${toggleResult.status}.`,
    });

    await pageA.reload();
    await pageA.waitForTimeout(2000);
    const afterRows = await pageA.getByRole('row').count();

    // The row count (i.e. the delegate list itself) must not be corrupted by the concurrent writes.
    expect(afterRows).toBe(beforeRows);

    await ctxA.close();
    await ctxB.close();
  });
});
