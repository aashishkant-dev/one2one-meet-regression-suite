import { Page, Locator } from '@playwright/test';

export interface MeetingRequest {
  delegateCompany: string;
  requestedTime: string;
  requestedWith: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt?: string;
}

export class MeetingRequestPage {
  constructor(private page: Page) {}

  async goto() {
    // Navigate to organizer's Meeting Requests or Inbox dashboard
    const requestsNav = this.page.getByRole('link', { name: /meeting request|inbox|request/i });
    if (await requestsNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestsNav.click();
      await this.page.waitForLoadState('networkidle');
    } else {
      // Alternative: check if requests are on main dashboard
      await this.page.goto('/organizer/dashboard');
      await this.page.waitForLoadState('networkidle');
    }
  }

  // View & List
  async getPendingRequests(): Promise<MeetingRequest[]> {
    const requests: MeetingRequest[] = [];
    const requestCards = this.page.locator('[data-testid="pending-request"], .request-card.pending, [class*="Request"][class*="pending"]');
    const count = await requestCards.count();

    for (let i = 0; i < count; i++) {
      const card = requestCards.nth(i);
      const company = await card.locator('[class*="company"], .company-name').textContent();
      const time = await card.locator('[class*="time"], .slot-time').textContent();
      const organizer = await card.locator('[class*="organizer"], .meeting-with').textContent();

      if (company && time) {
        requests.push({
          delegateCompany: company.trim(),
          requestedTime: time.trim(),
          requestedWith: organizer?.trim() || 'N/A',
          status: 'pending',
        });
      }
    }

    return requests;
  }

  async getApprovedRequests(): Promise<MeetingRequest[]> {
    const requests: MeetingRequest[] = [];
    const requestCards = this.page.locator('[data-testid="approved-request"], .request-card.approved, [class*="Request"][class*="approved"]');
    const count = await requestCards.count();

    for (let i = 0; i < count; i++) {
      const card = requestCards.nth(i);
      const company = await card.locator('[class*="company"], .company-name').textContent();
      const time = await card.locator('[class*="time"], .slot-time').textContent();
      const organizer = await card.locator('[class*="organizer"], .meeting-with').textContent();

      if (company && time) {
        requests.push({
          delegateCompany: company.trim(),
          requestedTime: time.trim(),
          requestedWith: organizer?.trim() || 'N/A',
          status: 'approved',
        });
      }
    }

    return requests;
  }

  async getPendingRequestCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="request-badge"], [class*="badge"][class*="request"]');
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  // Actions
  async approveRequest(delegateCompanyName: string) {
    const requestCard = this.requestCardByCompany(delegateCompanyName);
    const approveBtn = requestCard.getByRole('button', { name: /approve|accept|confirm/i });

    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await this.page.waitForLoadState('networkidle');
      // Optional: dismiss confirmation toast
      await this.dismissToastIfPresent();
    } else {
      throw new Error(`Cannot approve request for "${delegateCompanyName}" - Approve button not found`);
    }
  }

  async rejectRequest(delegateCompanyName: string, reason?: string) {
    const requestCard = this.requestCardByCompany(delegateCompanyName);
    const rejectBtn = requestCard.getByRole('button', { name: /reject|decline|refuse/i });

    if (await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rejectBtn.click();
      await this.page.waitForLoadState('domcontentloaded');

      // If a modal appears for reason input
      const reasonInput = this.page.getByPlaceholder(/reason|message|note/i);
      if (reason && await reasonInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reasonInput.fill(reason);
      }

      // Confirm rejection
      const confirmBtn = this.page.getByRole('button', { name: /confirm|submit|reject/i });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await this.page.waitForLoadState('networkidle');
      }

      await this.dismissToastIfPresent();
    } else {
      throw new Error(`Cannot reject request for "${delegateCompanyName}" - Reject button not found`);
    }
  }

  async rescheduleRequest(delegateCompanyName: string, newTimeLabel: string) {
    // Propose alternative time slot to delegate
    const requestCard = this.requestCardByCompany(delegateCompanyName);
    const rescheduleBtn = requestCard.getByRole('button', { name: /reschedule|suggest|propose/i });

    if (await rescheduleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rescheduleBtn.click();
      await this.page.waitForLoadState('domcontentloaded');

      // Select new time from modal/dropdown
      const slotOption = this.page.locator('[role="option"], .slot-option', { hasText: newTimeLabel }).first();
      if (await slotOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await slotOption.click();
      }

      // Submit reschedule
      const submitBtn = this.page.getByRole('button', { name: /submit|propose|send/i });
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await this.page.waitForLoadState('networkidle');
      }

      await this.dismissToastIfPresent();
    }
  }

  async viewRequestDetails(delegateCompanyName: string) {
    const requestCard = this.requestCardByCompany(delegateCompanyName);
    const detailsBtn = requestCard.getByRole('button', { name: /details|view|expand/i });

    if (await detailsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    } else {
      // Try clicking the card itself
      await requestCard.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async cancelMeeting(delegateCompanyName: string) {
    // Cancel a confirmed/approved meeting
    const meetingCard = this.page.locator('[data-testid="meeting"], .meeting-card', { hasText: delegateCompanyName }).first();
    const cancelBtn = meetingCard.getByRole('button', { name: /cancel|remove|delete/i });

    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
      await this.page.waitForLoadState('domcontentloaded');

      // Confirm cancellation
      const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|cancel/i });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await this.page.waitForLoadState('networkidle');
      }

      await this.dismissToastIfPresent();
    }
  }

  // Assertions
  async expectPendingRequest(delegateCompanyName: string) {
    const requests = await this.getPendingRequests();
    const found = requests.some(r => r.delegateCompany.includes(delegateCompanyName));

    if (!found) {
      throw new Error(`Expected pending request from "${delegateCompanyName}" not found. Pending: ${requests.map(r => r.delegateCompany).join(', ')}`);
    }
  }

  async expectApprovedRequest(delegateCompanyName: string) {
    const requests = await this.getApprovedRequests();
    const found = requests.some(r => r.delegateCompany.includes(delegateCompanyName));

    if (!found) {
      throw new Error(`Expected approved request from "${delegateCompanyName}" not found`);
    }
  }

  async expectNoPendingRequests() {
    const requests = await this.getPendingRequests();
    if (requests.length > 0) {
      throw new Error(`Expected no pending requests, but found ${requests.length}`);
    }
  }

  async expectRequestNotification(text?: string) {
    const notification = this.page.locator('[role="alert"], .notification, [class*="Toast"]');
    await notification.waitFor({ timeout: 5000 });

    if (text) {
      const content = await notification.textContent();
      if (!content?.includes(text)) {
        throw new Error(`Notification does not contain expected text: "${text}"`);
      }
    }
  }

  // Utility
  requestCardByCompany(companyName: string): Locator {
    return this.page.locator('[data-testid="request"], .request-card, [class*="Request"]', { hasText: companyName }).first();
  }

  pendingRequestsContainer(): Locator {
    return this.page.locator('[data-testid="pending-requests"], [class*="PendingRequests"], .requests-container');
  }

  approvedMeetingsContainer(): Locator {
    return this.page.locator('[data-testid="approved-meetings"], [class*="ApprovedMeetings"], .meetings-container');
  }

  private async dismissToastIfPresent() {
    const toast = this.page.locator('[role="status"], .toast, [class*="Toast"]');
    if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Wait for it to auto-dismiss or click close button
      const closeBtn = toast.getByRole('button', { name: /close|dismiss/i });
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
      await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }
}
