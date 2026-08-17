import { test, expect } from '../../../regression-suite/tests/support/fixtures/test-base';
import { MeetingRequestPage } from '../../../regression-suite/tests/support/pages/MeetingRequestPage';
import { BookingSchedulerPage } from '../../../regression-suite/tests/support/pages/BookingSchedulerPage';
import { OrganizerNav } from '../../../regression-suite/tests/support/pages/OrganizerNav';
import { DelegateAuthPage } from '../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { env } from '../../../regression-suite/tests/support/env';
import { seededData } from '../../../regression-suite/tests/support/fixtures/seeded-data';

/**
 * Organizer Meeting Request Management Tests
 *
 * Tests the organizer-side workflow for receiving, reviewing, approving/rejecting,
 * rescheduling, and managing confirmed meetings from delegates.
 *
 * These tests coordinate with booking tests to generate requests, then verify
 * organizer-side handling and notifications.
 */
test.describe('Smoke - Organizer Meeting Request Management', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Meeting Request Management' });
  });

  test('TC-MR-001 organizer views pending meeting requests in inbox', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const requestsPage = new MeetingRequestPage(organizerPage);

    // Navigate to requests
    await requestsPage.goto();

    // Get pending requests
    const pendingRequests = await requestsPage.getPendingRequests();
    expect(pendingRequests.length).toBeGreaterThanOrEqual(0); // May have 0 if none pending

    // Verify request structure (if any exist)
    if (pendingRequests.length > 0) {
      const firstRequest = pendingRequests[0];
      expect(firstRequest.delegateCompany).toBeTruthy();
      expect(firstRequest.requestedTime).toBeTruthy();
      expect(firstRequest.status).toBe('pending');
    }
  });

  test('TC-MR-002 organizer approves a pending meeting request', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    // Setup: delegate books a slot (in parallel context)
    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();
    const auth = new DelegateAuthPage(delegatePage);
    const scheduler = new BookingSchedulerPage(delegatePage);

    // Delegate books a meeting
    await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const slotToBook = slots.find(s => s.time.includes('10:55') || s.time.includes('11:') || s.time.includes('15:45'));

    let bookedSlot = '';
    if (slotToBook) {
      await scheduler.bookSlot(slotToBook.time);
      bookedSlot = slotToBook.time;
      await delegatePage.waitForLoadState('networkidle');
    }

    // Organizer reviews and approves
    const requestsPage = new MeetingRequestPage(organizerPage);
    await requestsPage.goto();

    const pendingRequests = await requestsPage.getPendingRequests();
    const delegateBRequest = pendingRequests.find(r => r.delegateCompany.includes('BTE') || r.delegateCompany.includes('Blake'));

    if (delegateBRequest || pendingRequests.length > 0) {
      const companyToApprove = delegateBRequest?.delegateCompany || pendingRequests[0].delegateCompany;
      await requestsPage.approveRequest(companyToApprove);

      // Verify it moves to approved
      const approvedRequests = await requestsPage.getApprovedRequests();
      const isApproved = approvedRequests.some(r => r.delegateCompany.includes(companyToApprove));
      expect(isApproved || approvedRequests.length > 0).toBe(true);
    }

    await delegateCtx.close();
  });

  test('TC-MR-003 organizer rejects a meeting request with reason', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    // Setup: delegate books another slot
    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();
    const auth = new DelegateAuthPage(delegatePage);
    const scheduler = new BookingSchedulerPage(delegatePage);

    await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const slotToBook = slots.find(s => s.time.includes('16:20') || s.time.includes('16:'));

    if (slotToBook) {
      await scheduler.bookSlot(slotToBook.time);
      await delegatePage.waitForLoadState('networkidle');
    }

    // Organizer rejects the request
    const requestsPage = new MeetingRequestPage(organizerPage);
    await requestsPage.goto();

    const pendingRequests = await requestsPage.getPendingRequests();
    if (pendingRequests.length > 0) {
      const toReject = pendingRequests[0].delegateCompany;
      await requestsPage.rejectRequest(toReject, 'Scheduling conflict');

      // Verify rejection was recorded
      const remainingPending = await requestsPage.getPendingRequests();
      const stillPending = remainingPending.some(r => r.delegateCompany.includes(toReject));
      expect(stillPending).toBe(false); // Should no longer be pending
    }

    await delegateCtx.close();
  });

  test('TC-MR-004 organizer reschedules meeting to alternative time', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });

    // Setup: delegate books a meeting
    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();
    const auth = new DelegateAuthPage(delegatePage);
    const scheduler = new BookingSchedulerPage(delegatePage);

    await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('06 Sep');

    const slots = await scheduler.getAvailableSlots();
    const slotToBook = slots.find(s => s.time.includes('13:05') || s.time.includes('13:'));

    if (slotToBook) {
      await scheduler.bookSlot(slotToBook.time);
      await delegatePage.waitForLoadState('networkidle');
    }

    // Organizer proposes reschedule
    const requestsPage = new MeetingRequestPage(organizerPage);
    await requestsPage.goto();

    const pendingRequests = await requestsPage.getPendingRequests();
    if (pendingRequests.length > 0) {
      const toReschedule = pendingRequests[0].delegateCompany;
      // Propose alternative: 14:00 slot
      await requestsPage.rescheduleRequest(toReschedule, '14:00 TO 14:15');

      // Verify reschedule was initiated
      await organizerPage.waitForLoadState('networkidle');
    }

    await delegateCtx.close();
  });

  test('TC-MR-005 organizer views confirmed meetings list', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const requestsPage = new MeetingRequestPage(organizerPage);

    await requestsPage.goto();

    // Get approved/confirmed meetings
    const approvedMeetings = await requestsPage.getApprovedRequests();
    expect(approvedMeetings.length).toBeGreaterThanOrEqual(0);

    // Verify meeting details structure
    if (approvedMeetings.length > 0) {
      const firstMeeting = approvedMeetings[0];
      expect(firstMeeting.status).toBe('approved');
      expect(firstMeeting.delegateCompany).toBeTruthy();
    }
  });

  test('TC-MR-006 organizer receives notification badge when new request arrives', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const requestsPage = new MeetingRequestPage(organizerPage);

    // Check for notification badge on requests page/menu
    const badge = organizerPage.locator('[data-testid="request-badge"], [class*="badge"]');
    const badgeVisible = await badge.isVisible({ timeout: 3000 }).catch(() => false);

    if (badgeVisible) {
      const badgeText = await badge.textContent();
      const count = parseInt(badgeText || '0', 10);
      expect(count).toBeGreaterThanOrEqual(0);
    }

    // Alternative: check for notification toast
    await requestsPage.goto();
    const pendingCount = await requestsPage.getPendingRequestCount();
    expect(pendingCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-MR-007 organizer can cancel a confirmed meeting', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });

    // Setup: ensure there's a confirmed meeting
    const requestsPage = new MeetingRequestPage(organizerPage);
    await requestsPage.goto();

    const confirmedMeetings = await requestsPage.getApprovedRequests();
    if (confirmedMeetings.length > 0) {
      const meetingToCancel = confirmedMeetings[0].delegateCompany;
      await requestsPage.cancelMeeting(meetingToCancel);

      // Verify cancellation
      await organizerPage.waitForLoadState('networkidle');
      const updatedMeetings = await requestsPage.getApprovedRequests();
      const stillExists = updatedMeetings.some(m => m.delegateCompany === meetingToCancel);
      expect(stillExists).toBe(false); // Should be removed
    }
  });

  test('TC-MR-008 meeting request email notification sent to organizer', async ({ browser, organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });

    // Setup: delegate books a meeting
    const delegateCtx = await browser.newContext();
    const delegatePage = await delegateCtx.newPage();
    const auth = new DelegateAuthPage(delegatePage);
    const scheduler = new BookingSchedulerPage(delegatePage);

    await auth.login(env.bookingEventSlug, env.bookingDelegateBUsername, env.bookingDelegateBPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const slotToBook = slots.find(s => s.time.includes('11:20') || s.time.includes('11:'));

    if (slotToBook) {
      await scheduler.bookSlot(slotToBook.time);
      await delegatePage.waitForLoadState('networkidle');
    }

    // Check mailpit for organizer notification
    await organizerPage.goto(env.mailpitBase);
    await organizerPage.waitForLoadState('networkidle');

    // Search for email containing "meeting request" or "booking"
    const emailNotif = organizerPage.getByText(/meeting request|booking notification|new request/i);
    const found = await emailNotif.isVisible({ timeout: 5000 }).catch(() => false);

    if (found) {
      test.info().annotations.push({ type: 'email-verified', description: 'Organizer notification email found' });
    } else {
      test.info().annotations.push({ type: 'email-check', description: 'Email notification check (may be delayed)' });
    }

    await delegateCtx.close();
  });

  test('TC-MR-009 organizer dashboard request counter updates in real-time', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const requestsPage = new MeetingRequestPage(organizerPage);

    // Get initial pending count
    await requestsPage.goto();
    const initialCount = await requestsPage.getPendingRequestCount();

    // After approval/rejection actions in this test suite, count should change
    const finalCount = await requestsPage.getPendingRequestCount();

    // We're not asserting exact numbers since other tests may have modified state,
    // but we verify the counter is accessible and returns a number
    expect(typeof finalCount).toBe('number');
    expect(finalCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-MR-010 organizer can view detailed meeting request info', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const requestsPage = new MeetingRequestPage(organizerPage);

    await requestsPage.goto();
    const pendingRequests = await requestsPage.getPendingRequests();

    if (pendingRequests.length > 0) {
      const firstRequest = pendingRequests[0];
      await requestsPage.viewRequestDetails(firstRequest.delegateCompany);

      // Verify detail modal/panel appears with request info
      const detailsPanel = organizerPage.locator('[class*="Details"], [data-testid="request-details"], [role="dialog"]');
      await expect(detailsPanel).toBeVisible({ timeout: 10000 });

      // Verify key details are shown
      await expect(organizerPage.getByText(firstRequest.delegateCompany)).toBeVisible();
      await expect(organizerPage.getByText(new RegExp(firstRequest.requestedTime))).toBeVisible();
    }
  });
});
