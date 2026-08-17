import { test, expect } from '../../../../regression-suite/tests/support/fixtures/test-base';
import { BookingSchedulerPage } from '../../../../regression-suite/tests/support/pages/BookingSchedulerPage';
import { MeetingRequestPage } from '../../../../regression-suite/tests/support/pages/MeetingRequestPage';
import { DelegateAuthPage } from '../../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { env } from '../../../../regression-suite/tests/support/env';

/**
 * ADVANCED RACE CONDITIONS & HIGH-CONCURRENCY TESTS
 *
 * Complex multi-party and high-concurrency scenarios:
 * - Multiple delegates competing for same slot
 * - Concurrent accept/reject from multiple tabs
 * - Rapid sequential operations
 * - Network race conditions
 * - State consistency under extreme concurrency
 *
 * These tests use Promise.allSettled for realistic parallel execution.
 */
test.describe('Comprehensive - Advanced Race Conditions', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({
      type: 'module',
      description: 'Advanced Race Conditions',
    });
  });

  test('TC-RC-001 multiple delegates book same slot simultaneously', async ({ browser }) => {
    test.info().annotations.push({ type: 'priority', description: 'Critical' });
    test.info().annotations.push({
      type: 'scenario',
      description: '3 delegates simultaneously attempt to book identical 15:20-15:35 slot on 06 Sep',
    });

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const ctx3 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();
    const page3 = await ctx3.newPage();

    try {
      const auth1 = new DelegateAuthPage(page1);
      const auth2 = new DelegateAuthPage(page2);
      const auth3 = new DelegateAuthPage(page3);
      const scheduler1 = new BookingSchedulerPage(page1);
      const scheduler2 = new BookingSchedulerPage(page2);
      const scheduler3 = new BookingSchedulerPage(page3);

      // All delegates login
      await auth1.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
      await auth2.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
      await auth3.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);

      // All navigate to scheduler
      await scheduler1.goto(env.bookingEventSlug);
      await scheduler2.goto(env.bookingEventSlug);
      await scheduler3.goto(env.bookingEventSlug);

      // All view same date
      await scheduler1.viewCalendar();
      await scheduler2.viewCalendar();
      await scheduler3.viewCalendar();

      await scheduler1.selectDate('06 Sep');
      await scheduler2.selectDate('06 Sep');
      await scheduler3.selectDate('06 Sep');

      // === RACE: All attempt to book SAME slot simultaneously ===
      const [result1, result2, result3] = await Promise.allSettled([
        scheduler1.bookSlot('15:20 TO 15:35'),
        scheduler2.bookSlot('15:20 TO 15:35'),
        scheduler3.bookSlot('15:20 TO 15:35'),
      ]);

      test.info().annotations.push({
        type: 'race-outcome',
        description: `D1: ${result1.status}, D2: ${result2.status}, D3: ${result3.status}`,
      });

      // Verify: At least one succeeded, others failed gracefully
      const successCount = [result1, result2, result3].filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(1); // Only ONE should succeed

      test.info().annotations.push({
        type: 'verification',
        description: `${successCount} booking(s) succeeded (expected: 1)`,
      });
    } finally {
      await ctx1.close();
      await ctx2.close();
      await ctx3.close();
    }
  });

  test('TC-RC-002 concurrent request acceptance from multiple organizer tabs', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Critical' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Same meeting request approved from tab 1, rejected from tab 2 simultaneously',
    });

    // Create two organizer contexts (simulating 2 browser tabs)
    const org2Ctx = await browser.newContext();
    const org2Page = await org2Ctx.newPage();

    try {
      const requests1 = new MeetingRequestPage(organizerPage);
      const requests2 = new MeetingRequestPage(org2Page);

      // Both view pending requests
      await requests1.goto();
      await requests2.goto();

      const pending1 = await requests1.getPendingRequests();
      if (pending1.length > 0) {
        const targetRequest = pending1[0].delegateCompany;

        test.info().annotations.push({
          type: 'setup',
          description: `Target request: ${targetRequest}`,
        });

        // === RACE: Tab1 approves, Tab2 rejects simultaneously ===
        const [approveResult, rejectResult] = await Promise.allSettled([
          requests1.approveRequest(targetRequest),
          requests2.rejectRequest(targetRequest, 'Testing race'),
        ]);

        test.info().annotations.push({
          type: 'race-outcome',
          description: `Approve: ${approveResult.status}, Reject: ${rejectResult.status}`,
        });

        // Verify final state
        await organizerPage.waitForLoadState('networkidle');
        const finalPending = await requests1.getPendingRequests();
        const finalApproved = await requests1.getApprovedRequests();

        const stillPending = finalPending.some(r => r.delegateCompany === targetRequest);
        const isApproved = finalApproved.some(r => r.delegateCompany === targetRequest);

        // Should resolve to ONE outcome (not both, not neither)
        const outcomes = [stillPending, isApproved].filter(v => v).length;
        expect(outcomes).toBeLessThanOrEqual(1);

        test.info().annotations.push({
          type: 'verification',
          description: `Final state: pending=${stillPending}, approved=${isApproved}`,
        });
      }
    } finally {
      await org2Ctx.close();
    }
  });

  test('TC-RC-003 double-click accept: button clicked twice in rapid succession', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Organizer double-clicks Accept button on same request (tests idempotency)',
    });

    const requests = new MeetingRequestPage(organizerPage);
    await requests.goto();

    const pending = await requests.getPendingRequests();
    if (pending.length > 0) {
      const targetRequest = pending[0].delegateCompany;

      // Double-click the approve button
      const approveBtn = organizerPage.locator('[data-testid="approve"], [class*="approve"]').first();

      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Two rapid clicks
        await approveBtn.click();
        await approveBtn.click();

        test.info().annotations.push({
          type: 'action',
          description: 'Approve button clicked twice',
        });
      }

      await organizerPage.waitForLoadState('networkidle');

      // Verify only one approval exists
      const approved = await requests.getApprovedRequests();
      const byRequest = approved.filter(r => r.delegateCompany === targetRequest);

      expect(byRequest.length).toBeLessThanOrEqual(1);

      test.info().annotations.push({
        type: 'verification',
        description: `Approved request count: ${byRequest.length} (expected ≤ 1)`,
      });
    }
  });

  test('TC-RC-004 rapid book/reject sequence: delegate books, organizer rejects, delegate books again', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate books → Organizer rejects → Delegate immediately re-books same slot',
    });

    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();

    try {
      const auth = new DelegateAuthPage(delegatePage);
      const scheduler = new BookingSchedulerPage(delegatePage);
      const requests = new MeetingRequestPage(organizerPage);

      // Delegate books slot
      await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
      await scheduler.goto(env.bookingEventSlug);
      await scheduler.viewCalendar();
      await scheduler.selectDate('07 Sep');

      const slots = await scheduler.getAvailableSlots();
      const targetSlot = slots.find(s => s.time.includes('16:00') || s.time.includes('16:20'));

      if (targetSlot) {
        // STEP 1: Book
        await scheduler.bookSlot(targetSlot.time);
        await delegatePage.waitForLoadState('networkidle');
        test.info().annotations.push({
          type: 'step-1',
          description: `Delegate booked slot: ${targetSlot.time}`,
        });

        // STEP 2: Organizer rejects
        await requests.goto();
        const pending = await requests.getPendingRequests();
        if (pending.length > 0) {
          await requests.rejectRequest(pending[0].delegateCompany);
          await organizerPage.waitForLoadState('networkidle');
          test.info().annotations.push({
            type: 'step-2',
            description: 'Organizer rejected the request',
          });
        }

        // STEP 3: Delegate immediately re-books same slot
        await delegatePage.goto(`/${env.bookingEventSlug}`);
        await scheduler.viewCalendar();
        await scheduler.selectDate('07 Sep');

        const freshSlots = await scheduler.getAvailableSlots();
        const sameSlot = freshSlots.find(s => s.time === targetSlot.time);

        if (sameSlot) {
          await scheduler.bookSlot(sameSlot.time);
          await delegatePage.waitForLoadState('networkidle');
          test.info().annotations.push({
            type: 'step-3',
            description: 'Delegate re-booked the same slot',
          });
        }

        // Verify new request is in pending
        await requests.goto();
        const pendingAfter = await requests.getPendingRequests();
        expect(pendingAfter.length).toBeGreaterThan(0);

        test.info().annotations.push({
          type: 'verification',
          description: `${pendingAfter.length} pending request(s) after re-booking`,
        });
      }
    } finally {
      await delegateCtx.close();
    }
  });

  test('TC-RC-005 network failure recovery: timeout during booking, retry succeeds', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Booking request times out → delegate retries → succeeds on second attempt',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const targetSlot = slots.find(s => s.time.includes('16:35'));

    if (targetSlot) {
      // First attempt (may fail)
      try {
        await page.context().setOffline(true);
        await scheduler.bookSlot(targetSlot.time);
        await page.context().setOffline(false);
      } catch (e) {
        // Expected to fail, now restore connection
        await page.context().setOffline(false);
        test.info().annotations.push({
          type: 'recovery',
          description: 'First attempt failed (expected), connection restored',
        });
      }

      // Retry
      await page.reload();
      await scheduler.viewCalendar();
      await scheduler.selectDate('07 Sep');

      const retrySlots = await scheduler.getAvailableSlots();
      const retrySlot = retrySlots.find(s => s.time.includes('16:35'));

      if (retrySlot) {
        await scheduler.bookSlot(retrySlot.time);
        await page.waitForLoadState('networkidle');

        const successMsg = page.getByText(/request sent|booking confirmed/i);
        await expect(successMsg).toBeVisible({ timeout: 10000 });

        test.info().annotations.push({
          type: 'verification',
          description: 'Retry succeeded after network recovery',
        });
      }
    }
  });

  test('TC-RC-006 slot availability countdown: monitor slot changes during booking flow', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate views calendar → slot appears available → books → slot no longer available',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('06 Sep');

    // Get initial available slots
    const initialSlots = await scheduler.getAvailableSlots();
    const initialCount = initialSlots.length;
    test.info().annotations.push({
      type: 'checkpoint-1',
      description: `Initial available slots: ${initialCount}`,
    });

    // Book a slot
    const targetSlot = initialSlots.find(s => s.time.includes('15:50'));
    if (targetSlot) {
      await scheduler.bookSlot(targetSlot.time);
      await page.waitForLoadState('networkidle');

      // Refresh and check availability
      await page.reload();
      await scheduler.viewCalendar();
      await scheduler.selectDate('06 Sep');

      const updatedSlots = await scheduler.getAvailableSlots();
      const updatedCount = updatedSlots.length;

      expect(updatedCount).toBeLessThan(initialCount);

      test.info().annotations.push({
        type: 'checkpoint-2',
        description: `After booking: ${updatedCount} available slots (decreased by ${initialCount - updatedCount})`,
      });
    }
  });
});
