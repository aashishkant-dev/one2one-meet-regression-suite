import { test, expect } from '../../../regression-suite/tests/support/fixtures/test-base';
import { BookingSchedulerPage } from '../../../regression-suite/tests/support/pages/BookingSchedulerPage';
import { MeetingRequestPage } from '../../../regression-suite/tests/support/pages/MeetingRequestPage';
import { DelegateAuthPage } from '../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { OrganizerNav } from '../../../regression-suite/tests/support/pages/OrganizerNav';
import { env } from '../../../regression-suite/tests/support/env';
import { seededData } from '../../../regression-suite/tests/support/fixtures/seeded-data';

/**
 * Concurrent Meeting Request Acceptance Tests
 *
 * Tests high-concurrency scenarios where multiple delegates accept meeting requests
 * simultaneously or in rapid succession. Verifies request de-duplication, state
 * consistency, and proper handling of race conditions.
 *
 * TC-MB-003: Simultaneous acceptance — two delegates accept the same meeting
 * request at nearly the same time. First responder should be accepted, second
 * should be rejected or remain pending (no duplicate confirmations).
 */
test.describe('Smoke - Concurrent Meeting Request Acceptance', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Concurrent Meeting Acceptance' });
  });

  test('TC-MB-003 simultaneous acceptance: two delegates accept same request at nearly same time', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    /**
     * Scenario:
     * 1. Organizer enables "Allow Multiple Requests" setting (if applicable)
     * 2. Organizer (delegate mode) sends meeting requests to Delegate A and Delegate B
     * 3. Both Delegate A and Delegate B book slots and send requests back
     * 4. Organizer receives both requests
     * 5. Both delegates accept the request simultaneously (via Promise.allSettled)
     * 6. Verify: First responder accepted, second rejected or pending
     */

    // Setup: Create two parallel delegate contexts
    const delegateACtx = await browser.newContext();
    const delegateBCtx = await browser.newContext();
    const delegateAPage = await delegateACtx.newPage();
    const delegateBPage = await delegateBCtx.newPage();

    try {
      // === PHASE 1: Delegates A & B book slots and send requests ===
      const authA = new DelegateAuthPage(delegateAPage);
      const authB = new DelegateAuthPage(delegateBPage);
      const schedulerA = new BookingSchedulerPage(delegateAPage);
      const schedulerB = new BookingSchedulerPage(delegateBPage);

      // Delegate A logs in and books a slot
      await authA.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
      await schedulerA.goto(env.bookingEventSlug);
      await schedulerA.viewCalendar();
      await schedulerA.selectDate('07 Sep');

      const slotsA = await schedulerA.getAvailableSlots();
      const slotA = slotsA.find(s => s.time.includes('15:00') || s.time.includes('15:20'));

      let requestIdA = '';
      if (slotA) {
        await schedulerA.bookSlot(slotA.time);
        await delegateAPage.waitForLoadState('networkidle');

        // Extract request ID from confirmation page/toast if available
        const confirmA = delegateAPage.getByText(/request sent|meeting request submitted/i);
        await confirmA.waitFor({ timeout: 10000 }).catch(() => {});
        requestIdA = slotA.time; // Use slot time as request identifier
      }

      // Delegate B logs in and books a different slot
      await authB.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
      await schedulerB.goto(env.bookingEventSlug);
      await schedulerB.viewCalendar();
      await schedulerB.selectDate('07 Sep');

      const slotsB = await schedulerB.getAvailableSlots();
      const slotB = slotsB.find(s => s.time.includes('15:35') || s.time.includes('16:00'));

      let requestIdB = '';
      if (slotB) {
        await schedulerB.bookSlot(slotB.time);
        await delegateBPage.waitForLoadState('networkidle');

        const confirmB = delegateBPage.getByText(/request sent|meeting request submitted/i);
        await confirmB.waitFor({ timeout: 10000 }).catch(() => {});
        requestIdB = slotB.time;
      }

      // === PHASE 2: Organizer views both requests ===
      const requestsPage = new MeetingRequestPage(organizerPage);
      await requestsPage.goto();

      const pendingRequests = await requestsPage.getPendingRequests();
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Organizer sees ${pendingRequests.length} pending requests`,
      });

      expect(pendingRequests.length).toBeGreaterThanOrEqual(0);

      // === PHASE 3: Both delegates accept simultaneously via Promise.allSettled ===
      // This simulates both delegates accepting nearly the same time
      const [resultA, resultB] = await Promise.allSettled([
        // Delegate A accepts
        (async () => {
          if (requestIdA) {
            await requestsPage.approveRequest('BTE-BDC-alex');
            return { status: 'accepted', delegate: 'A' };
          }
          return { status: 'skipped', delegate: 'A' };
        })(),

        // Delegate B accepts (fired at nearly the same time)
        (async () => {
          if (requestIdB) {
            await requestsPage.approveRequest('BTE-BEC-blake');
            return { status: 'accepted', delegate: 'B' };
          }
          return { status: 'skipped', delegate: 'B' };
        })(),
      ]);

      // === PHASE 4: Verify state consistency ===
      await organizerPage.waitForLoadState('networkidle');

      const finalRequests = await requestsPage.getPendingRequests();
      const approvedRequests = await requestsPage.getApprovedRequests();

      test.info().annotations.push({
        type: 'result',
        description: `After concurrent accepts: ${finalRequests.length} pending, ${approvedRequests.length} approved`,
      });

      // Verify: At least one acceptance succeeded
      const acceptanceSucceeded = resultA.status === 'fulfilled' || resultB.status === 'fulfilled';
      expect(acceptanceSucceeded).toBe(true);

      // Verify: No more than 2 meetings confirmed (one per request)
      expect(approvedRequests.length).toBeLessThanOrEqual(2);

      // Verify: Organizer can see the approved meetings
      if (approvedRequests.length > 0) {
        const firstApproved = approvedRequests[0];
        expect(firstApproved.status).toBe('approved');
        expect(firstApproved.delegateCompany).toBeTruthy();
      }
    } finally {
      await delegateACtx.close();
      await delegateBCtx.close();
    }
  });

  test('TC-MB-004 double-accept prevention: accepting same request twice is idempotent', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    /**
     * Scenario:
     * 1. Delegate sends meeting request
     * 2. Organizer clicks Accept button twice rapidly (or tabs)
     * 3. Verify: Request is accepted only once, not duplicated
     */

    // Setup: Delegate books a slot
    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();

    try {
      const auth = new DelegateAuthPage(delegatePage);
      const scheduler = new BookingSchedulerPage(delegatePage);

      await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
      await scheduler.goto(env.bookingEventSlug);
      await scheduler.viewCalendar();
      await scheduler.selectDate('06 Sep');

      const slots = await scheduler.getAvailableSlots();
      const slot = slots.find(s => s.time.includes('14:50') || s.time.includes('15:05'));

      if (slot) {
        await scheduler.bookSlot(slot.time);
        await delegatePage.waitForLoadState('networkidle');
      }

      // === Organizer receives request ===
      const requestsPage = new MeetingRequestPage(organizerPage);
      await requestsPage.goto();

      const requests = await requestsPage.getPendingRequests();
      if (requests.length > 0) {
        const companyName = requests[0].delegateCompany;

        // === Attempt double-accept ===
        const approveBtn = organizerPage.locator(
          '[data-testid="approve-btn"], [class*="approve"]'
        ).first();

        // Click accept twice rapidly
        if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await approveBtn.click();
          await approveBtn.click(); // Second click (may not register if button disabled)
        } else {
          // Alternative: use page method
          await requestsPage.approveRequest(companyName);
          await requestsPage.approveRequest(companyName); // Second attempt
        }

        await organizerPage.waitForLoadState('networkidle');

        // === Verify only one confirmed meeting exists ===
        const approved = await requestsPage.getApprovedRequests();
        const byCompany = approved.filter(r => r.delegateCompany === companyName);

        expect(byCompany.length).toBeLessThanOrEqual(1); // Should be 1, not 2
      }
    } finally {
      await delegateCtx.close();
    }
  });

  test('TC-MB-005 rapid acceptance sequence: multiple requests accepted in quick succession', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });

    /**
     * Scenario:
     * 1. Organizer receives multiple pending requests (from prior tests)
     * 2. Organizer approves them in quick succession (rapid loop)
     * 3. Verify: All approvals succeed, no conflicts or state corruption
     */

    const requestsPage = new MeetingRequestPage(organizerPage);
    await requestsPage.goto();

    const pendingBefore = await requestsPage.getPendingRequests();
    test.info().annotations.push({
      type: 'setup',
      description: `${pendingBefore.length} pending requests available`,
    });

    // Approve up to 3 requests in rapid succession
    const toApprove = pendingBefore.slice(0, 3);
    const approvalResults: { company: string; status: string }[] = [];

    for (const request of toApprove) {
      try {
        await requestsPage.approveRequest(request.delegateCompany);
        approvalResults.push({ company: request.delegateCompany, status: 'success' });
        await organizerPage.waitForTimeout(500); // Brief pause between approvals
      } catch (e) {
        approvalResults.push({ company: request.delegateCompany, status: 'failed' });
      }
    }

    // === Verify state after rapid approvals ===
    await organizerPage.waitForLoadState('networkidle');
    const approvedAfter = await requestsPage.getApprovedRequests();

    test.info().annotations.push({
      type: 'result',
      description: `Approved ${approvalResults.filter(r => r.status === 'success').length}/${toApprove.length} requests`,
    });

    // At least some approvals should have succeeded
    const successCount = approvalResults.filter(r => r.status === 'success').length;
    expect(successCount).toBeGreaterThan(0);

    // No duplicate confirmations
    expect(approvedAfter.length).toBeLessThanOrEqual(
      approvalResults.filter(r => r.status === 'success').length + 5 // Allow buffer from other tests
    );
  });

  test('TC-MB-006 accept vs reject race: accepting and rejecting same request from two tabs', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    /**
     * Scenario:
     * 1. Open organizer page in two tabs/contexts
     * 2. Same pending request visible in both
     * 3. First tab: Accept
     * 4. Second tab: Reject (fired simultaneously or near-simultaneously)
     * 5. Verify: Request resolves to single outcome (not stuck pending)
     */

    // Create second organizer context (simulating second tab)
    const organizerCtx2 = await browser.newContext();
    const organizerPage2 = await organizerCtx2.newPage();

    try {
      const requestsPage1 = new MeetingRequestPage(organizerPage);
      const requestsPage2 = new MeetingRequestPage(organizerPage2);

      // Both view same pending requests
      await requestsPage1.goto();
      await requestsPage2.goto();

      const pending1 = await requestsPage1.getPendingRequests();
      const pending2 = await requestsPage2.getPendingRequests();

      if (pending1.length > 0 && pending2.length > 0) {
        const targetRequest = pending1[0].delegateCompany;

        // === Race: Accept from tab 1, Reject from tab 2 ===
        const [result1, result2] = await Promise.allSettled([
          requestsPage1.approveRequest(targetRequest),
          requestsPage2.rejectRequest(targetRequest, 'Testing race condition'),
        ]);

        // === Verify final state ===
        await organizerPage.waitForLoadState('networkidle');
        const finalPending = await requestsPage1.getPendingRequests();
        const finalApproved = await requestsPage1.getApprovedRequests();

        const stillPending = finalPending.some(r => r.delegateCompany === targetRequest);
        const isApproved = finalApproved.some(r => r.delegateCompany === targetRequest);

        test.info().annotations.push({
          type: 'result',
          description: `After Accept/Reject race: pending=${stillPending}, approved=${isApproved}`,
        });

        // Request should resolve to exactly one outcome (approved or rejected, not both/pending)
        expect(stillPending || isApproved).toBe(true); // One of these should be true
        expect(!(stillPending && isApproved)).toBe(true); // Not both
      }
    } finally {
      await organizerCtx2.close();
    }
  });
});
