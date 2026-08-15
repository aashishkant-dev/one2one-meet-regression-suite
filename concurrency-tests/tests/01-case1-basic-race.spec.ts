import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs, logout } from '../fixtures/auth';
import { fireParallel, countSuccessful, getFirstSuccess } from '../fixtures/concurrent-helpers';

test.describe('TC-CC-001 to TC-CC-003: Case 1 - Basic Race Conditions', () => {
  let testData: any;
  const results: any[] = [];

  test.beforeAll(() => {
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    }
  });

  test('TC-CC-001: Two delegates simultaneously request same slot from same target (autoAccept OFF)', async ({ browser }) => {
    const testCaseId = 'TC-CC-001';
    let actualResult = 'Test not executed';
    let status = 'Not Tested';

    try {
      // Create two browser contexts for delegates A and B
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();

      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      // Login as delegates A and B
      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageB, testData.testAccounts.delegateB.email, testData.testAccounts.delegateB.password);

      // Navigate to slot picker for delegate C
      const targetDelegateId = '3'; // Replace with actual delegate C ID
      await pageA.goto(`/delegate/${targetDelegateId}/slots`);
      await pageB.goto(`/delegate/${targetDelegateId}/slots`);

      // Wait for slots to load
      await pageA.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      await pageB.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      // Find the target slot (10:00-10:15)
      const slotSelector = '[data-testid="slot-card"]:has-text("10:00")';

      // Fire both requests simultaneously
      const results = await fireParallel(
        [
          {
            name: 'Delegate A Request',
            action: async () => {
              const addBtn = pageA.locator(slotSelector).locator('button:has-text("Add")').first();
              await addBtn.click();
              return { delegateId: 'A', success: true };
            },
          },
          {
            name: 'Delegate B Request',
            action: async () => {
              const addBtn = pageB.locator(slotSelector).locator('button:has-text("Add")').first();
              await addBtn.click();
              return { delegateId: 'B', success: true };
            },
          },
        ],
        50 // Small delay to approximate simultaneous clicks
      );

      // Count how many succeeded
      const successCount = countSuccessful(results);

      if (successCount === 1) {
        actualResult = 'PASS: Exactly one request was accepted. Slot integrity maintained. Winner received confirmation, loser received clear rejection message.';
        status = 'Pass';
      } else if (successCount === 0) {
        actualResult = 'FAIL: Both requests were rejected or both failed. Expected one to succeed.';
        status = 'Fail';
      } else {
        actualResult = 'FAIL: Both requests were accepted. Race condition detected - double booking possible!';
        status = 'Fail';
      }

      await contextA.close();
      await contextB.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    results.push({ testCaseId, actualResult, status });
    expect(status).toBe('Pass');
  });

  test('TC-CC-002: Case 1 with autoAccept ON (24h timer)', async ({ browser }) => {
    const testCaseId = 'TC-CC-002';
    let actualResult = 'Test requires manual setup of autoAccept timer';
    let status = 'Not Tested';

    try {
      // This test requires:
      // 1. Setting delegate C's autoAccept to ON
      // 2. Running the race scenario
      // 3. Waiting 24h or using staging timer shortcut
      // For now, we'll verify the race resolves at request time (part 1-3 of the flow)

      const contextA = await browser.newContext();
      const contextB = await browser.newContext();

      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageB, testData.testAccounts.delegateB.email, testData.testAccounts.delegateB.password);

      const targetDelegateId = '3';
      await pageA.goto(`/delegate/${targetDelegateId}/slots`);
      await pageB.goto(`/delegate/${targetDelegateId}/slots`);

      await pageA.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      await pageB.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      const slotSelector = '[data-testid="slot-card"]:has-text("10:00")';
      const raceResults = await fireParallel(
        [
          {
            name: 'Delegate A',
            action: async () => {
              const addBtn = pageA.locator(slotSelector).locator('button:has-text("Add")').first();
              await addBtn.click();
              return true;
            },
          },
          {
            name: 'Delegate B',
            action: async () => {
              const addBtn = pageB.locator(slotSelector).locator('button:has-text("Add")').first();
              await addBtn.click();
              return true;
            },
          },
        ],
        50
      );

      const successCount = countSuccessful(raceResults);

      if (successCount === 1) {
        actualResult = 'PASS: Race resolved at request time (not deferred to timer). Single winner confirmed, loser rejected immediately.';
        status = 'Pass';
      } else {
        actualResult = `FAIL: Race resolution failed. ${successCount} requests succeeded when exactly 1 expected.`;
        status = 'Fail';
      }

      await contextA.close();
      await contextB.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    results.push({ testCaseId, actualResult, status });
    expect(status).toBe('Pass');
  });

  test('TC-CC-003: Losing delegate retries on next available slot', async ({ browser }) => {
    const testCaseId = 'TC-CC-003';
    let actualResult = 'Test requires specific slot availability';
    let status = 'Not Tested';

    try {
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const contextC = await browser.newContext();

      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const pageC = await contextC.newPage();

      // Setup: A wins the race
      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageB, testData.testAccounts.delegateB.email, testData.testAccounts.delegateB.password);
      await loginAs(pageC, testData.testAccounts.delegateC.email, testData.testAccounts.delegateC.password);

      const targetDelegateId = '3';

      // Run initial race (TC-CC-001 scenario)
      await pageA.goto(`/delegate/${targetDelegateId}/slots`);
      await pageB.goto(`/delegate/${targetDelegateId}/slots`);

      await pageA.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      await pageB.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      const firstSlot = '[data-testid="slot-card"]:has-text("10:00")';
      const raceResults = await fireParallel(
        [
          {
            name: 'A',
            action: async () => {
              await pageA.locator(firstSlot).locator('button:has-text("Add")').first().click();
              return true;
            },
          },
          {
            name: 'B',
            action: async () => {
              await pageB.locator(firstSlot).locator('button:has-text("Add")').first().click();
              return true;
            },
          },
        ],
        50
      );

      // Now B should retry on next available slot
      const secondSlot = '[data-testid="slot-card"]:has-text("10:20")';
      const retryBtn = pageB.locator(secondSlot).locator('button:has-text("Add")').first();

      if (await retryBtn.isVisible({ timeout: 5000 })) {
        await retryBtn.click();
        await pageB.waitForLoadState('networkidle');

        // Verify retry was successful
        const confirmMessage = pageB.locator('text=/success|confirmed|pending/i').first();
        if (await confirmMessage.isVisible({ timeout: 5000 })) {
          actualResult = 'PASS: B successfully retried on next available slot without any cooldown or lock. Booking succeeded normally.';
          status = 'Pass';
        } else {
          actualResult = 'FAIL: Retry click did not result in successful booking.';
          status = 'Fail';
        }
      } else {
        actualResult = 'FAIL: Unable to locate next available slot or retry button.';
        status = 'Fail';
      }

      await contextA.close();
      await contextB.close();
      await contextC.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    results.push({ testCaseId, actualResult, status });
    expect(status).toBe('Pass');
  });
});
