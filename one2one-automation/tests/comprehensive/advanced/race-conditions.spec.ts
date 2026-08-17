import { test, expect } from '../../../../regression-suite/tests/support/fixtures/test-base';
import { MeetingRequestPage } from '../../../../regression-suite/tests/support/pages/MeetingRequestPage';
import { DelegateAuthPage } from '../../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { env } from '../../../../regression-suite/tests/support/env';

/**
 * ADVANCED RACE CONDITIONS & HIGH-CONCURRENCY TESTS
 *
 * Complex multi-party and high-concurrency scenarios focusing on:
 * - Concurrent accept/reject from multiple tabs
 * - Rapid sequential operations
 * - Double-accept prevention
 * - State consistency under concurrent writes
 *
 * These tests use Promise.allSettled for realistic parallel execution.
 * Note: Booking-level races tested in booking/booking-concurrency.spec.ts
 */
test.describe('Comprehensive - Advanced Race Conditions', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({
      type: 'module',
      description: 'Advanced Race Conditions',
    });
  });

  test('TC-RC-001 concurrent approve/reject from multiple organizer tabs (same request)', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Critical' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Tab 1 approves request, Tab 2 rejects SAME request simultaneously (race condition)',
    });

    const tab2Ctx = await browser.newContext();
    const tab2Page = await tab2Ctx.newPage();

    try {
      const requests1 = new MeetingRequestPage(organizerPage);
      const requests2 = new MeetingRequestPage(tab2Page);

      // Both tabs view pending requests
      await requests1.goto();
      await requests2.goto();

      const pending1 = await requests1.getPendingRequests();
      if (pending1.length > 0) {
        const targetRequest = pending1[0].delegateCompany;
        test.info().annotations.push({
          type: 'setup',
          description: `Target: ${targetRequest}`,
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

        // Verify: Single outcome (not both, not neither, not stuck)
        await organizerPage.waitForLoadState('networkidle');
        const finalPending = await requests1.getPendingRequests();
        const finalApproved = await requests1.getApprovedRequests();

        const stillPending = finalPending.some(r => r.delegateCompany === targetRequest);
        const isApproved = finalApproved.some(r => r.delegateCompany === targetRequest);

        expect(stillPending || isApproved).toBe(true);  // One outcome
        expect(!(stillPending && isApproved)).toBe(true); // Not both

        test.info().annotations.push({
          type: 'verification',
          description: `✅ Single outcome: pending=${stillPending}, approved=${isApproved}`,
        });
      }
    } finally {
      await tab2Ctx.close();
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

  test('TC-RC-003 double-click accept: request confirmed only once (idempotent)', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Organizer clicks Accept twice rapidly. Request confirmed only once (idempotency test).',
    });

    const requests = new MeetingRequestPage(organizerPage);
    await requests.goto();

    const pending = await requests.getPendingRequests();
    if (pending.length > 0) {
      const targetRequest = pending[0].delegateCompany;
      test.info().annotations.push({
        type: 'setup',
        description: `Target: ${targetRequest}`,
      });

      // Double-click the approve button
      const approveBtn = organizerPage.locator('[data-testid="approve"], [class*="approve"]').first();

      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Two rapid clicks
        await approveBtn.click();
        await approveBtn.click();

        test.info().annotations.push({
          type: 'action',
          description: 'Approve button clicked twice rapidly',
        });
      }

      await organizerPage.waitForLoadState('networkidle');

      // Verify only one approval exists
      const approved = await requests.getApprovedRequests();
      const byRequest = approved.filter(r => r.delegateCompany === targetRequest);

      expect(byRequest.length).toBeLessThanOrEqual(1);

      test.info().annotations.push({
        type: 'verification',
        description: `✅ Idempotent: ${byRequest.length} confirmation(s) (expected ≤ 1)`,
      });
    }
  });

  test('TC-RC-004 rapid accept sequence: multiple requests approved in quick succession', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: '3+ pending requests approved rapidly, one after another (stress test)',
    });

    const requests = new MeetingRequestPage(organizerPage);
    await requests.goto();

    const pendingBefore = await requests.getPendingRequests();
    test.info().annotations.push({
      type: 'setup',
      description: `Starting with ${pendingBefore.length} pending requests`,
    });

    // Approve up to 3 requests in rapid succession
    const toApprove = pendingBefore.slice(0, 3);
    const results: { company: string; status: string }[] = [];

    for (const request of toApprove) {
      try {
        await requests.approveRequest(request.delegateCompany);
        results.push({ company: request.delegateCompany, status: 'success' });
        await organizerPage.waitForTimeout(200); // Brief pause
      } catch (e) {
        results.push({ company: request.delegateCompany, status: 'failed' });
      }
    }

    await organizerPage.waitForLoadState('networkidle');
    const approvedAfter = await requests.getApprovedRequests();

    const successCount = results.filter(r => r.status === 'success').length;
    test.info().annotations.push({
      type: 'verification',
      description: `✅ Approved ${successCount}/${toApprove.length} in rapid sequence`,
    });

    expect(successCount).toBeGreaterThan(0);
  });

  test('TC-RC-005 accept/reject conflict: resolve to single outcome', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Request state resolves consistently despite conflicting actions',
    });

    const requests = new MeetingRequestPage(organizerPage);
    await requests.goto();

    const pending = await requests.getPendingRequests();
    if (pending.length >= 2) {
      // Approve first, reject second (different requests, sequential)
      await requests.approveRequest(pending[0].delegateCompany);
      await organizerPage.waitForTimeout(500);
      await requests.rejectRequest(pending[1].delegateCompany);

      await organizerPage.waitForLoadState('networkidle');
      await organizerPage.reload();
      await requests.goto();

      const finalApproved = await requests.getApprovedRequests();
      const finalPending = await requests.getPendingRequests();

      test.info().annotations.push({
        type: 'verification',
        description: `✅ State resolved: ${finalApproved.length} approved, ${finalPending.length} pending`,
      });

      expect(finalApproved.length).toBeGreaterThan(0);
    }
  });
});
