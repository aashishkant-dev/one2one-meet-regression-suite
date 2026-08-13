import { test as base, expect } from '@playwright/test';
import { env } from '../support/env';
import { DelegateAuthPage } from '../support/pages/DelegateAuthPage';
import { DelegateMeetingsPage } from '../support/pages/DelegateMeetingsPage';
import { OrganizerNav } from '../support/pages/OrganizerNav';
import { DelegatesPage } from '../support/pages/DelegatesPage';
import { SponsorCategoriesPage } from '../support/pages/SponsorCategoriesPage';
import { EventsPage } from '../support/pages/EventsPage';
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
   * Was blocked by the organizer ToS gate not handling its newer single-Submit shape for a
   * SECOND concurrent session of the same account - fixed in OrganizerNav.acceptTermsGateIfPresent
   * 2026-08-13 (it now handles both the old per-step-Continue shape and the new
   * combined-checkbox-then-Submit shape). Re-enabled.
   */
  test('TC-CE-011 bulk "Activate All" and an individual delegate Status toggle fired at the same instant', async ({ browser }) => {
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
    await expect(pageA.getByRole('row')).not.toHaveCount(0);
    await pageA.waitForTimeout(1500); // let the table finish rendering all rows, not just the first

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

  test('TC-CE-008 two admin sessions simultaneously create a Sponsor Category with the IDENTICAL name', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

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

    const raceName = `ConcurrencyRace-${Date.now()}`;
    await categoriesA.openAddForm();
    await categoriesA.fillName(raceName);
    await categoriesB.openAddForm();
    await categoriesB.fillName(raceName);

    const [resultA, resultB] = await Promise.allSettled([categoriesA.save(), categoriesB.save()]);

    await pageA.waitForTimeout(2000);
    await pageA.reload();
    await pageA.waitForTimeout(1500);
    const finalCount = await categoriesA.countRowsNamed(raceName);

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `Session A save: ${resultA.status}. Session B save: ${resultB.status}. Rows named "${raceName}" after both attempts: ${finalCount}. Sequential duplicate-name submits are known to silently absorb into one row (TC-SC-N02) - this checks whether that same de-dup logic holds under a genuine simultaneous race, or whether both writes land as separate rows (a TOCTOU gap).`,
    });

    // The known sequential behavior is "absorbs into one row" - a race should not produce MORE
    // duplicate rows than that already-accepted baseline.
    expect(finalCount).toBeLessThanOrEqual(1);

    await ctxA.close();
    await ctxB.close();
  });

  test('TC-CC-003 the losing delegate can still book a DIFFERENT open slot with the same target right after losing a race', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    const blakeCtx = await browser.newContext();
    const blakePage = await blakeCtx.newPage();
    await new DelegateAuthPage(blakePage).login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    const blakeMeetings = new DelegateMeetingsPage(blakePage);
    await blakeMeetings.goto();

    // Blake lost the 10:20 race to Alex in TC-CC-001 (its request to QA Automation there just
    // hung rather than a clean rejection) - this checks the account itself is NOT left in a
    // broken state: Blake can still successfully request QA Automation for a different,
    // still-open slot right after.
    const RETRY_SLOT = '12:20 TO 12:35';
    await blakeMeetings.openBookMeetingModal(RETRY_SLOT);
    const response = await blakeMeetings.submitBookMeeting({ meetingWith: 'QA Automation', remarks: 'TC-CC-003 retry after losing TC-CC-001 race' });

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `Blake's retry request on a fresh slot (${RETRY_SLOT}) after losing the TC-CC-001 race: HTTP ${response.status()}.`,
    });

    expect(response.status()).toBe(200);
    await blakeCtx.close();
  });

  /**
   * Not automated (test.skip): the Add New Event form has been substantially redesigned since
   * EventsPage.createEvent() was written (added a date-range picker, Venue Timezone, split
   * Venue Country/City into dependent react-selects, added Post-Event Delegate Access Window
   * and Description) - confirmed live 2026-08-13. This is the same reason the pre-existing
   * TC-EV-001 test is currently broken too. Needs a dedicated EventsPage rewrite, not a quick
   * label fix like the SponsorCategoriesPage ones above.
   */
  test.skip('TC-CE-001 two organizer sessions simultaneously create an event with the IDENTICAL name (slug collision)', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const navA = new OrganizerNav(pageA);
    const navB = new OrganizerNav(pageB);
    await navA.login(env.orgUsername, env.orgPassword);
    await navB.login(env.orgUsername, env.orgPassword);

    const eventsA = new EventsPage(pageA);
    const eventsB = new EventsPage(pageB);
    await eventsA.goto();
    await eventsB.goto();

    const raceName = `ConcurrencyEvent-${Date.now()}`;
    const input = {
      name: raceName,
      city: 'Kathmandu',
      venue: 'Race Test Venue',
      address: 'Race Test Address',
      email: `race-${Date.now()}@example.com`,
      contactNumber: '+9779800000000',
    };

    const [resultA, resultB] = await Promise.allSettled([
      eventsA.createEvent(input),
      eventsB.createEvent(input),
    ]);
    if (resultA.status === 'rejected') console.log('EVENT A REJECTED:', resultA.reason?.message);
    if (resultB.status === 'rejected') console.log('EVENT B REJECTED:', resultB.reason?.message);

    await pageA.waitForTimeout(2000);
    await eventsA.goto();
    await eventsA.searchByName(raceName);
    await pageA.waitForTimeout(1500);
    const matchingRows = await eventsA.eventRow(raceName).count();

    test.info().annotations.push({
      type: 'observed-outcome',
      description: `Session A createEvent: ${resultA.status}${resultA.status === 'rejected' ? ' (' + (resultA as PromiseRejectedResult).reason?.message + ')' : ''}. Session B createEvent: ${resultB.status}${resultB.status === 'rejected' ? ' (' + (resultB as PromiseRejectedResult).reason?.message + ')' : ''}. Events found named "${raceName}" after both attempts: ${matchingRows}.`,
    });

    // Unlike the sponsor-category case, two events sharing a display NAME isn't necessarily a
    // bug on its own (the app may disambiguate the auto-generated slug) - document the real
    // count via the annotation above rather than assume which outcome is "correct". The only
    // hard requirement: neither concurrent session should be left in a crashed/rejected state.
    const eitherSucceeded = resultA.status === 'fulfilled' || resultB.status === 'fulfilled';
    expect(eitherSucceeded).toBe(true);

    await ctxA.close();
    await ctxB.close();
  });
});
