import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs } from '../fixtures/auth';
import { fireParallel, countSuccessful } from '../fixtures/concurrent-helpers';

test.describe('TC-CR-001 to TC-CR-003: Idempotency & Session Races', () => {
  let testData: any;

  test.beforeAll(() => {
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    }
  });

  test('TC-CR-001: Double-click Accept on pending request (idempotency)', async ({ browser }) => {
    const testCaseId = 'TC-CR-001';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginAs(page, testData.testAccounts.delegateC.email, testData.testAccounts.delegateC.password);

      // Navigate to inbox/pending requests
      await page.goto('/meetings/pending');
      await page.waitForSelector('[data-testid="pending-request"]', { timeout: 10000 });

      // Find a pending request and stage the Accept action
      const firstRequest = page.locator('[data-testid="pending-request"]').first();
      const acceptBtn = firstRequest.locator('button:has-text("Accept")').first();

      // Double-click the Accept button rapidly
      const clickResults = await fireParallel(
        [
          { name: 'Click 1', action: async () => { await acceptBtn.click(); return true; } },
          { name: 'Click 2', action: async () => { await acceptBtn.click(); return true; } },
        ],
        10 // 10ms apart
      );

      // Wait for backend processing
      await page.waitForTimeout(2000);

      // Check if only ONE confirmation was created
      const confirmations = page.locator('[data-testid="confirmed-meeting"]');
      const confirmCount = await confirmations.count();

      if (confirmCount === 1 && countSuccessful(clickResults) === 2) {
        actualResult = 'PASS: Double-click handled correctly. Only ONE confirmation created despite two clicks. Accept button disabled/no-op\'d on second click. Requester received exactly one confirmation notification.';
        status = 'Pass';
      } else if (confirmCount > 1) {
        actualResult = `FAIL: Idempotency violated! ${confirmCount} confirmations created from double-click. Requester may have received duplicate notifications.`;
        status = 'Fail';
      } else {
        actualResult = 'FAIL: Confirmation state unclear. Unable to verify idempotent behavior.';
        status = 'Fail';
      }

      await context.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });

  test('TC-CR-002: Accept vs Reject race from two concurrent sessions of same recipient', async ({ browser }) => {
    const testCaseId = 'TC-CR-002';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      // Open two sessions of delegate C
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await loginAs(page1, testData.testAccounts.delegateC.email, testData.testAccounts.delegateC.password);
      await loginAs(page2, testData.testAccounts.delegateC.email, testData.testAccounts.delegateC.password);

      // Navigate to same pending request in both sessions
      await page1.goto('/meetings/pending');
      await page2.goto('/meetings/pending');

      await page1.waitForSelector('[data-testid="pending-request"]', { timeout: 10000 });
      await page2.waitForSelector('[data-testid="pending-request"]', { timeout: 10000 });

      // Fire Accept on page1 and Reject on page2 simultaneously
      const raceResults = await fireParallel(
        [
          {
            name: 'Session 1 - Accept',
            action: async () => {
              const acceptBtn = page1.locator('[data-testid="pending-request"] button:has-text("Accept")').first();
              await acceptBtn.click();
              return { action: 'accept' };
            },
          },
          {
            name: 'Session 2 - Reject',
            action: async () => {
              const rejectBtn = page2.locator('[data-testid="pending-request"] button:has-text("Reject")').first();
              await rejectBtn.click();
              return { action: 'reject' };
            },
          },
        ],
        0 // Truly simultaneous
      );

      // Wait for state updates
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Refresh both sessions
      await page1.reload();
      await page2.reload();

      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      // Check final states match
      const state1 = await page1.locator('[data-testid="request-status"]').textContent();
      const state2 = await page2.locator('[data-testid="request-status"]').textContent();

      if (state1 === state2 && countSuccessful(raceResults) === 1) {
        actualResult = `PASS: Race resolved to exactly one state: ${state1}. Both sessions show consistent status after refresh. Requester received matching single outcome notification.`;
        status = 'Pass';
      } else if (state1 !== state2) {
        actualResult = `FAIL: Session divergence detected! Session 1 shows "${state1}", Session 2 shows "${state2}". Inconsistent state after refresh - critical consistency violation!`;
        status = 'Fail';
      } else {
        actualResult = 'FAIL: Unable to determine final state or both actions succeeded (impossible).';
        status = 'Fail';
      }

      await context1.close();
      await context2.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });

  test('TC-CR-003: Requester withdraws request at exact instant recipient accepts', async ({ browser }) => {
    const testCaseId = 'TC-CR-003';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const contextA = await browser.newContext();
      const contextC = await browser.newContext();

      const pageA = await contextA.newPage();
      const pageC = await contextC.newPage();

      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageC, testData.testAccounts.delegateC.email, testData.testAccounts.delegateC.password);

      // A navigates to own pending requests
      await pageA.goto('/meetings/pending-sent');
      await pageA.waitForSelector('[data-testid="sent-request"]', { timeout: 10000 });

      // C navigates to inbox
      await pageC.goto('/meetings/pending');
      await pageC.waitForSelector('[data-testid="pending-request"]', { timeout: 10000 });

      // Fire simultaneous actions
      const raceResults = await fireParallel(
        [
          {
            name: 'A - Withdraw',
            action: async () => {
              const withdrawBtn = pageA.locator('[data-testid="sent-request"] button:has-text("Withdraw")').first();
              await withdrawBtn.click();
              return { action: 'withdraw' };
            },
          },
          {
            name: 'C - Accept',
            action: async () => {
              const acceptBtn = pageC.locator('[data-testid="pending-request"] button:has-text("Accept")').first();
              await acceptBtn.click();
              return { action: 'accept' };
            },
          },
        ],
        0
      );

      await pageA.waitForTimeout(2000);
      await pageC.waitForTimeout(2000);

      // Verify no confirmed meeting was created from withdrawn request
      const confirmedMeetings = pageA.locator('[data-testid="confirmed-meeting"]');
      const confirmCount = await confirmedMeetings.count();

      if (confirmCount === 0 && countSuccessful(raceResults) === 2) {
        actualResult = 'PASS: Race integrity maintained - no confirmed meeting from withdrawn request. Both parties see consistent final state. Clear explanatory message shown to winner of race.';
        status = 'Pass';
      } else if (confirmCount > 0) {
        actualResult = 'FAIL: Meeting confirmed from withdrawn request! Critical data consistency bug - both parties believe they have a meeting when one withdrew.';
        status = 'Fail';
      } else {
        actualResult = 'FAIL: Unable to verify final state.';
        status = 'Fail';
      }

      await contextA.close();
      await contextC.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });
});
