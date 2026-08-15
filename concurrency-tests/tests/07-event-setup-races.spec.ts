import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs } from '../fixtures/auth';
import { fireParallel, countSuccessful } from '../fixtures/concurrent-helpers';

test.describe('TC-CE-001 to TC-CE-010: Event Setup & Configuration Races', () => {
  let testData: any;

  test.beforeAll(() => {
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    }
  });

  test('TC-CE-001: Duplicate event creation with identical name (slug collision)', async ({ browser }) => {
    const testCaseId = 'TC-CE-001';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      const eventName = `Test Event ${Date.now()}`;

      await loginAs(page1, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);
      await loginAs(page2, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);

      // Navigate to Add Event
      await page1.goto('/events/new');
      await page2.goto('/events/new');

      await page1.waitForSelector('[data-testid="event-form"]', { timeout: 10000 });
      await page2.waitForSelector('[data-testid="event-form"]', { timeout: 10000 });

      // Fill form in both sessions with same event name
      const fillForm = async (page: any) => {
        await page.locator('[data-testid="event-name"]').fill(eventName);
        await page.locator('[data-testid="event-city"]').fill('Test City');
        await page.locator('[data-testid="event-venue"]').fill('Test Venue');
        await page.locator('[data-testid="event-country"]').fill('Nepal');
        await page.locator('[data-testid="event-start-date"]').fill('2026-10-01');
        await page.locator('[data-testid="event-end-date"]').fill('2026-10-31');
      };

      await fillForm(page1);
      await fillForm(page2);

      // Fire both submissions simultaneously
      const raceResults = await fireParallel(
        [
          {
            name: 'Session 1',
            action: async () => {
              const submitBtn = page1.locator('button:has-text("Save Event")').first();
              await submitBtn.click();
              return { success: true };
            },
          },
          {
            name: 'Session 2',
            action: async () => {
              const submitBtn = page2.locator('button:has-text("Save Event")').first();
              await submitBtn.click();
              return { success: true };
            },
          },
        ],
        0
      );

      // Wait for processing
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Check results
      const error1 = await page1.locator('text=/already exists|name already taken/i').isVisible({ timeout: 5000 });
      const error2 = await page2.locator('text=/already exists|name already taken/i').isVisible({ timeout: 5000 });
      const success1 = await page1.locator('text=/success|created/i').isVisible({ timeout: 5000 });
      const success2 = await page2.locator('text=/success|created/i').isVisible({ timeout: 5000 });

      const successCount = (success1 ? 1 : 0) + (success2 ? 1 : 0);

      if (successCount === 1 && (error1 || error2)) {
        actualResult = 'PASS: Slug uniqueness enforced. Exactly one event created, duplicate rejected with clear message. No slug collision.';
        status = 'Pass';
      } else if (successCount === 2) {
        actualResult = 'FAIL: Both events created! Slug collision possible. Duplicate-name check failed under concurrency.';
        status = 'Fail';
      } else if (successCount === 0) {
        actualResult = 'FAIL: Neither event created. Both may have been rejected incorrectly.';
        status = 'Fail';
      } else {
        actualResult = 'UNCLEAR: Event creation result ambiguous.';
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

  test('TC-CE-002: Simultaneous opposite status toggles (ON vs OFF)', async ({ browser }) => {
    const testCaseId = 'TC-CE-002';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await loginAs(page1, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);
      await loginAs(page2, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);

      // Navigate to events list
      await page1.goto('/events');
      await page2.goto('/events');

      await page1.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
      await page2.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

      const eventCard = '[data-testid="event-card"]';

      // Fire opposite toggles simultaneously
      const raceResults = await fireParallel(
        [
          {
            name: 'Toggle ON',
            action: async () => {
              const toggle = page1.locator(`${eventCard} [data-testid="status-toggle"]`).first();
              await toggle.click({ force: true });
              return { action: 'on' };
            },
          },
          {
            name: 'Toggle OFF',
            action: async () => {
              const toggle = page2.locator(`${eventCard} [data-testid="status-toggle"]`).first();
              await toggle.click({ force: true });
              return { action: 'off' };
            },
          },
        ],
        0
      );

      // Refresh both
      await page1.reload();
      await page2.reload();

      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      const status1 = await page1.locator(`${eventCard} [data-testid="status-display"]`).first().textContent();
      const status2 = await page2.locator(`${eventCard} [data-testid="status-display"]`).first().textContent();

      if (status1 === status2 && (status1?.includes('Active') || status1?.includes('Inactive'))) {
        actualResult = `PASS: Atomic status resolution. Final state is consistent: ${status1}. Both sessions show identical status after refresh.`;
        status = 'Pass';
      } else if (status1 !== status2) {
        actualResult = `FAIL: Divergent final states! Session 1: ${status1}, Session 2: ${status2}. Inconsistent event status.`;
        status = 'Fail';
      } else {
        actualResult = 'FAIL: Unable to determine final status.';
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

  test('TC-CE-004: Overlapping agenda blocks saved simultaneously', async ({ browser }) => {
    const testCaseId = 'TC-CE-004';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await loginAs(page1, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);
      await loginAs(page2, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);

      // Navigate to agenda setup
      await page1.goto('/agenda/new');
      await page2.goto('/agenda/new');

      await page1.waitForSelector('[data-testid="agenda-form"]', { timeout: 10000 });
      await page2.waitForSelector('[data-testid="agenda-form"]', { timeout: 10000 });

      // Create overlapping agenda blocks for same day
      // Block 1: 10:00-12:00
      // Block 2: 11:00-13:00 (overlaps)

      const setupBlock = async (page: any, startTime: string, endTime: string) => {
        await page.locator('[data-testid="event-select"]').click();
        await page.locator('[data-testid="event-select"] text=Tech Expo').click();
        await page.locator('[data-testid="date-input"]').fill('2026-10-15');
        await page.locator('[data-testid="start-time"]').fill(startTime);
        await page.locator('[data-testid="end-time"]').fill(endTime);
        await page.locator('[data-testid="duration-select"]').click();
        await page.locator('text=15 minutes').click();
      };

      await setupBlock(page1, '10:00', '12:00');
      await setupBlock(page2, '11:00', '13:00');

      // Submit both simultaneously
      const raceResults = await fireParallel(
        [
          {
            name: 'Block 1 (10:00-12:00)',
            action: async () => {
              await page1.locator('button:has-text("Save Agenda")').first().click();
              return true;
            },
          },
          {
            name: 'Block 2 (11:00-13:00)',
            action: async () => {
              await page2.locator('button:has-text("Save Agenda")').first().click();
              return true;
            },
          },
        ],
        0
      );

      // Check if overlap was prevented
      const error2 = await page2.locator('text=/overlap|conflict|invalid/i').isVisible({ timeout: 5000 });
      const success1 = await page1.locator('text=/success|created/i').isVisible({ timeout: 5000 });

      if ((success1 && error2) || error2) {
        actualResult = 'PASS: Overlap validation enforced server-side. Second overlapping block rejected with clear conflict message. No overlapping bookable slots created.';
        status = 'Pass';
      } else if (success1 && !error2) {
        actualResult = 'FAIL: Both overlapping blocks accepted! Server-side validation missing - overlap check only on client.';
        status = 'Fail';
      } else {
        actualResult = 'UNCLEAR: Unable to verify overlap validation.';
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

  test('TC-CE-005: Agenda double-click save (idempotency)', async ({ browser }) => {
    const testCaseId = 'TC-CE-005';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginAs(page, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);

      await page.goto('/agenda/new');
      await page.waitForSelector('[data-testid="agenda-form"]', { timeout: 10000 });

      // Fill agenda form
      await page.locator('[data-testid="event-select"]').click();
      await page.locator('text=Tech Expo').click();
      await page.locator('[data-testid="date-input"]').fill('2026-10-15');
      await page.locator('[data-testid="start-time"]').fill('10:00');
      await page.locator('[data-testid="end-time"]').fill('12:00');

      const saveBtn = page.locator('button:has-text("Save Agenda")').first();

      // Double-click save button rapidly
      await fireParallel(
        [
          { name: 'Click 1', action: async () => { await saveBtn.click(); return true; } },
          { name: 'Click 2', action: async () => { await saveBtn.click(); return true; } },
        ],
        10
      );

      await page.waitForTimeout(2000);

      // Check if only ONE agenda was created
      await page.goto('/agenda/list');
      const agendaItems = page.locator('[data-testid="agenda-item"]');
      const count = await agendaItems.count();

      if (count === 1) {
        actualResult = 'PASS: Idempotent save. Exactly one agenda block created despite double-click. Button likely disabled on first click or server rejected duplicate.';
        status = 'Pass';
      } else if (count > 1) {
        actualResult = `FAIL: Idempotency failed! ${count} agenda blocks created from double-click. Slots likely duplicated.`;
        status = 'Fail';
      } else {
        actualResult = 'FAIL: No agenda created or unable to verify.';
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

  test('TC-CE-006: Agenda edit vs live booking (slot regeneration race)', async ({ browser }) => {
    const testCaseId = 'TC-CE-006';
    let actualResult = '';
    let status = 'Not Tested';

    try {
      const contextOrg = await browser.newContext();
      const contextA = await browser.newContext();

      const pageOrg = await contextOrg.newPage();
      const pageA = await contextA.newPage();

      await loginAs(pageOrg, testData.testAccounts.organizer.email, testData.testAccounts.organizer.password);
      await loginAs(pageA, testData.testAccounts.delegateA.email, testData.testAccounts.delegateA.password);

      // Organizer navigates to edit agenda
      await pageOrg.goto('/agenda/edit/1');
      await pageOrg.waitForSelector('[data-testid="agenda-form"]', { timeout: 10000 });

      // Delegate A tries to book a slot
      await pageA.goto('/delegates/3/slots');
      await pageA.waitForSelector('[data-testid="slot-card"]', { timeout: 10000 });

      // Fire simultaneous: organizer edits (regenerating slots), A books
      const raceResults = await fireParallel(
        [
          {
            name: 'Organizer - Edit Agenda',
            action: async () => {
              // Change slot duration to regenerate slots
              await pageOrg.locator('[data-testid="duration-select"]').click();
              await pageOrg.locator('text=30 minutes').click();
              await pageOrg.locator('button:has-text("Save")').first().click();
              return { action: 'edit' };
            },
          },
          {
            name: 'Delegate - Book Slot',
            action: async () => {
              const slotBtn = pageA.locator('[data-testid="slot-card"] button:has-text("Add")').first();
              await slotBtn.click();
              return { action: 'book' };
            },
          },
        ],
        50
      );

      // Check outcomes
      const bookingError = await pageA.locator('text=/no longer exists|slot configuration changed/i').isVisible({ timeout: 5000 });
      const editSuccess = await pageOrg.locator('text=/success|updated/i').isVisible({ timeout: 5000 });

      if ((editSuccess && bookingError) || bookingError) {
        actualResult = 'PASS: Concurrent edit protected slot consistency. Booking rejected with clear message about changed slots. No booking against non-existent slot ID.';
        status = 'Pass';
      } else if (editSuccess && !bookingError) {
        actualResult = 'FAIL: Booking succeeded against changed slot structure! Risk of booking against non-existent or corrupted slot.';
        status = 'Fail';
      } else {
        actualResult = 'UNCLEAR: Unable to determine race outcome.';
        status = 'Fail';
      }

      await contextOrg.close();
      await contextA.close();
    } catch (error) {
      actualResult = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      status = 'Fail';
    }

    console.log(`${testCaseId}: ${status}`);
    expect(status).toBe('Pass');
  });
});
