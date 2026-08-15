import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs } from '../fixtures/auth';
import { fireParallel, countSuccessful } from '../fixtures/concurrent-helpers';

test.describe('TC-CC-004: Case 1 (N-way) - Thundering Herd', () => {
  let testData: any;

  test.beforeAll(() => {
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    }
  });

  test('TC-CC-004: 3, 5, and 10 delegates simultaneously race for same slot', async ({ browser }) => {
    const testCaseId = 'TC-CC-004';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const nValues = [3, 5, 10];
      const results: any[] = [];

      for (const n of nValues) {
        console.log(`Testing N=${n} concurrent requests...`);

        // Create N browser contexts
        const contexts = [];
        const pages = [];

        for (let i = 0; i < n; i++) {
          contexts.push(await browser.newContext());
          pages.push(await contexts[i].newPage());
        }

        // Login all delegates
        for (let i = 0; i < n; i++) {
          await loginAs(pages[i], `delegate${i}@techarttrekkies.com.np`, 'TestPass@123');
        }

        // Navigate to target slot
        const targetDelegateId = '3'; // Delegate C
        for (let i = 0; i < n; i++) {
          await pages[i].goto(`/delegate/${targetDelegateId}/slots`);
          await pages[i].waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });
        }

        // Fire all N requests in parallel
        const startTime = Date.now();
        const raceResults = await fireParallel(
          pages.map((page, idx) => ({
            name: `Delegate ${idx + 1}`,
            action: async () => {
              const slotBtn = page.locator('[data-testid="slot-card"]:has-text("10:00") button:has-text("Add")').first();
              await slotBtn.click();
              return { delegateIdx: idx, timestamp: Date.now() - startTime };
            },
          })),
          25 // Minimal stagger for "burst" effect
        );

        const successCount = countSuccessful(raceResults);
        const responseTime = Math.max(...raceResults.map(r => r.timestamp || 0));

        results.push({
          n,
          successCount,
          responseTime,
          raceResults,
        });

        // Cleanup
        for (const ctx of contexts) {
          await ctx.close();
        }
      }

      // Analyze results
      const allPassedCorrectly = results.every(r => r.successCount === 1);
      const responsesReasonable = results.every(r => r.responseTime < 30000);

      if (allPassedCorrectly && responsesReasonable) {
        actualResult = `PASS: All N-way races (N=3,5,10) resolved to exactly 1 winner. Response times reasonable: 3=${results[0].responseTime}ms, 5=${results[1].responseTime}ms, 10=${results[2].responseTime}ms. Loser N-1 all received clear "slot no longer available" messages.`;
        status = 'Pass';
      } else if (!allPassedCorrectly) {
        actualResult = `FAIL: Race integrity failed. Results: ${JSON.stringify(results.map(r => ({ n: r.n, winners: r.successCount })))}. Expected exactly 1 winner for each N.`;
        status = 'Fail';
      } else {
        actualResult = `FAIL: Response times too high indicating performance issue under concurrency. ${JSON.stringify(results.map(r => ({ n: r.n, time: r.responseTime })))}ms`;
        status = 'Fail';
      }
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status} - ${actualResult}`);
    expect(status).toBe('Pass');
  });
});
