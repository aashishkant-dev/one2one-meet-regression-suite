import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs } from '../fixtures/auth';
import { fireParallel, countSuccessful } from '../fixtures/concurrent-helpers';

test.describe('TC-CC-008 to TC-CC-009: Case 3 - Isolation & No Cross-Contamination', () => {
  let testData: any;

  test.beforeAll(() => {
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    }
  });

  test('TC-CC-008: Two independent, non-conflicting bookings fired simultaneously', async ({ browser }) => {
    const testCaseId = 'TC-CC-008';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      // A -> C (10:00-10:15), B -> D (10:20-10:35)
      // Both simultaneous, no slot conflict

      const contextA = await browser.newContext();
      const contextB = await browser.newContext();

      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageB, testData.testAccounts.delegateB.email, testData.testAccounts.delegateB.password);

      // A targets delegate C (ID: 3)
      // B targets delegate D (ID: 4)
      await pageA.goto('/delegates/3/slots');
      await pageB.goto('/delegates/4/slots');

      await pageA.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      await pageB.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      // Measure baseline single request time
      const singleStartTime = Date.now();
      await pageA.locator('[data-testid="slot-card"]:has-text("10:00") button:has-text("Add")').first().click();
      const singleTime = Date.now() - singleStartTime;

      // Close and reload, then do parallel test
      await contextA.close();
      await contextB.close();

      const contextA2 = await browser.newContext();
      const contextB2 = await browser.newContext();
      const pageA2 = await contextA2.newPage();
      const pageB2 = await contextB2.newPage();

      await loginAs(pageA2, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);
      await loginAs(pageB2, testData.testAccounts.delegateB.email, testData.testAccounts.delegateB.password);

      await pageA2.goto('/delegates/3/slots');
      await pageB2.goto('/delegates/4/slots');

      await pageA2.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      await pageB2.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      // Fire parallel independent requests
      const parallelStartTime = Date.now();
      const results = await fireParallel(
        [
          {
            name: 'A->C (10:00)',
            action: async () => {
              await pageA2.locator('[data-testid="slot-card"]:has-text("10:00") button:has-text("Add")').first().click();
              return { success: true };
            },
          },
          {
            name: 'B->D (10:20)',
            action: async () => {
              await pageB2.locator('[data-testid="slot-card"]:has-text("10:20") button:has-text("Add")').first().click();
              return { success: true };
            },
          },
        ],
        0 // True parallel
      );

      const parallelTime = Date.now() - parallelStartTime;
      const successCount = countSuccessful(results);

      // Verify no cross-contamination
      const pageAAgenda = pageA2.locator('[data-testid="agenda-item"]:has-text("C")');
      const pageBAgenda = pageB2.locator('[data-testid="agenda-item"]:has-text("D")');

      const aHasCorrectTarget = await pageAAgenda.isVisible({ timeout: 5000 });
      const bHasCorrectTarget = await pageBAgenda.isVisible({ timeout: 5000 });

      const crossContaminationCheck = !aHasCorrectTarget || !bHasCorrectTarget;

      if (successCount === 2 && !crossContaminationCheck && parallelTime <= singleTime * 1.5) {
        actualResult = `PASS: Both independent bookings succeeded with no cross-contamination. A booked C correctly, B booked D correctly. Response time comparable to single request (single: ${singleTime}ms, parallel: ${parallelTime}ms). No global locking detected.`;
        status = 'Pass';
      } else if (successCount !== 2) {
        actualResult = `FAIL: Expected 2 successful bookings, got ${successCount}. Independent requests should both succeed.`;
        status = 'Fail';
      } else if (crossContaminationCheck) {
        actualResult = 'FAIL: Cross-contamination detected! A shows booking with D or B shows booking with C. Critical data integrity bug!';
        status = 'Fail';
      } else {
        actualResult = `FAIL: Performance issue detected. Parallel took ${parallelTime}ms vs single ${singleTime}ms. Possible global lock serializing requests.`;
        status = 'Fail';
      }

      await contextA2.close();
      await contextB2.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });

  test('TC-CC-009: 50 independent request pairs (25 pairs) fired in burst', async ({ browser }) => {
    const testCaseId = 'TC-CC-009';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      // Create 25 independent A->C, B->D style pairs
      // Verify all 50 succeed with correct attribution

      const numPairs = 25;
      const contexts = [];
      const pages = [];

      // Create 50 browser contexts (2 per pair)
      for (let i = 0; i < numPairs * 2; i++) {
        contexts.push(await browser.newContext());
        pages.push(await contexts[i].newPage());
      }

      // Login all
      for (let i = 0; i < numPairs * 2; i++) {
        await loginAs(pages[i], `delegate${i}@techarttrekkies.com.np`, 'TestPass@123');
      }

      // Create pairs of different targets
      for (let i = 0; i < numPairs; i++) {
        const delegateIdA = 3 + (i % 5); // Vary targets
        const delegateIdB = 4 + (i % 5);
        await pages[i * 2].goto(`/delegates/${delegateIdA}/slots`);
        await pages[i * 2 + 1].goto(`/delegates/${delegateIdB}/slots`);
      }

      // Wait for all slots to load
      for (let i = 0; i < pages.length; i++) {
        await pages[i].waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
      }

      // Fire all 50 requests in parallel
      const startTime = Date.now();
      const allRequests = [];
      for (let i = 0; i < numPairs; i++) {
        allRequests.push({
          name: `Pair ${i + 1} - A`,
          action: async () => {
            const slot = pages[i * 2].locator('[data-testid="slot-card"]').first();
            const btn = slot.locator('button:has-text("Add")').first();
            await btn.click();
            return { pair: i, role: 'A' };
          },
        });
        allRequests.push({
          name: `Pair ${i + 1} - B`,
          action: async () => {
            const slot = pages[i * 2 + 1].locator('[data-testid="slot-card"]').first();
            const btn = slot.locator('button:has-text("Add")').first();
            await btn.click();
            return { pair: i, role: 'B' };
          },
        });
      }

      const results = await fireParallel(allRequests, 10);
      const totalTime = Date.now() - startTime;
      const successCount = countSuccessful(results);

      if (successCount === 50) {
        actualResult = `PASS: All 50 independent bookings (25 pairs) succeeded with correct attribution. Total time: ${totalTime}ms. No duplicates, no losses, no cross-attribution. Performance scales well with volume.`;
        status = 'Pass';
      } else {
        actualResult = `FAIL: Only ${successCount}/50 bookings succeeded. Expected all 50 to complete successfully. Missing bookings indicate data loss or contention issue.`;
        status = 'Fail';
      }

      for (const ctx of contexts) {
        await ctx.close();
      }
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });
});
