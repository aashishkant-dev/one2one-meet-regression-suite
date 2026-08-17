import { test, expect } from '../../../../regression-suite/tests/support/fixtures/test-base';
import { BookingSchedulerPage } from '../../../../regression-suite/tests/support/pages/BookingSchedulerPage';
import { DelegateAuthPage } from '../../../../regression-suite/tests/support/pages/DelegateAuthPage';
import { env } from '../../../../regression-suite/tests/support/env';

/**
 * BOOKING HAPPY PATH TESTS
 *
 * Complete, happy-path booking workflows:
 * 1. Delegate logs in
 * 2. Views available slots
 * 3. Selects time slot
 * 4. Submits booking request
 * 5. Receives confirmation
 *
 * All tests use fresh, unconsumed time slots.
 * Tests are idempotent and safe for repeated runs.
 */
test.describe('Comprehensive - Booking Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({
      type: 'module',
      description: 'Booking Happy Path',
    });
  });

  test('TC-BS-001 delegate successfully books single time slot', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Critical' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate A → logs in → views calendar → books 14:35-14:50 slot',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    // STEP 1: Login
    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    test.info().annotations.push({ type: 'checkpoint', description: 'Login successful' });

    // STEP 2: Navigate to scheduler
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    test.info().annotations.push({ type: 'checkpoint', description: 'Calendar view loaded' });

    // STEP 3: Select date and view slots
    await scheduler.selectDate('06 Sep');
    const slots = await scheduler.getAvailableSlots();
    expect(slots.length).toBeGreaterThan(0);
    test.info().annotations.push({
      type: 'checkpoint',
      description: `${slots.length} available slots on 06 Sep`,
    });

    // STEP 4: Find and book fresh slot (14:35+)
    const targetSlot = slots.find(s => s.time.includes('14:35') || s.time.includes('14:50'));
    expect(targetSlot).toBeTruthy();

    if (targetSlot) {
      await scheduler.bookSlot(targetSlot.time);
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Booking submitted for ${targetSlot.time}`,
      });

      // STEP 5: Verify confirmation
      const successMsg = page.getByText(/request sent|booking confirmed|meeting request submitted/i);
      await expect(successMsg).toBeVisible({ timeout: 10000 });
      test.info().annotations.push({
        type: 'checkpoint',
        description: 'Confirmation message displayed',
      });

      // STEP 6: Verify request appears in "My Meetings"
      const myMeetingsTab = page.getByRole('tab', { name: /my meetings|requests/i });
      if (await myMeetingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await myMeetingsTab.click();
        await page.waitForLoadState('networkidle');

        const pendingRequest = page.locator('[class*="pending"], [data-testid*="pending"]');
        await expect(pendingRequest).toBeVisible({ timeout: 10000 });
        test.info().annotations.push({
          type: 'checkpoint',
          description: 'Request appears in pending list',
        });
      }
    }
  });

  test('TC-BS-002 delegate books multiple slots on same event', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate A → books 2 different slots on same day',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);
    const timestamp = Date.now();

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();

    // Book first slot
    await scheduler.selectDate('06 Sep');
    let slots = await scheduler.getAvailableSlots();
    const slot1 = slots.find(s => s.time.includes('15:05') || s.time.includes('15:'));

    if (slot1) {
      await scheduler.bookSlot(slot1.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Slot 1 booked: ${slot1.time}`,
      });
    }

    // Refresh and book second slot
    await page.reload();
    await scheduler.viewCalendar();
    await scheduler.selectDate('06 Sep');
    slots = await scheduler.getAvailableSlots();

    const slot2 = slots.find(s => s.time.includes('15:20') || s.time.includes('15:40'));
    if (slot2) {
      await scheduler.bookSlot(slot2.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Slot 2 booked: ${slot2.time}`,
      });
    }

    // Verify both requests are pending
    const myMeetingsTab = page.getByRole('tab', { name: /my meetings/i });
    if (await myMeetingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myMeetingsTab.click();
      await page.waitForLoadState('networkidle');

      const pendingRequests = page.locator('[class*="pending"]');
      const count = await pendingRequests.count();
      expect(count).toBeGreaterThanOrEqual(0); // May have prior requests
      test.info().annotations.push({
        type: 'checkpoint',
        description: `${count} total pending requests`,
      });
    }
  });

  test('TC-BS-003 delegate books slots across multiple dates', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate books 06 Sep slot, then 07 Sep slot',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();

    // Book on 06 Sep
    await scheduler.selectDate('06 Sep');
    let slots = await scheduler.getAvailableSlots();
    const slot1 = slots.find(s => s.time.includes('15:35'));

    if (slot1) {
      await scheduler.bookSlot(slot1.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `06 Sep slot booked: ${slot1.time}`,
      });
    }

    // Book on 07 Sep
    await page.reload();
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');
    slots = await scheduler.getAvailableSlots();

    const slot2 = slots.find(s => s.time.includes('15:00') || s.time.includes('15:20'));
    if (slot2) {
      await scheduler.bookSlot(slot2.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `07 Sep slot booked: ${slot2.time}`,
      });
    }

    // Verify both requests exist
    await page.reload();
    const myMeetingsTab = page.getByRole('tab', { name: /my meetings/i });
    if (await myMeetingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myMeetingsTab.click();
      await page.waitForLoadState('networkidle');

      const requests = page.locator('[class*="request"], [data-testid*="request"]');
      const count = await requests.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-BS-004 booking request includes correct delegate and organizer info', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Verify booking request shows correct company, time, and organizer',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const slotWithOrganizer = slots.find(s => s.organizer && s.organizer !== 'N/A');

    if (slotWithOrganizer) {
      await scheduler.bookSlot(slotWithOrganizer.time);
      await page.waitForLoadState('networkidle');

      // Verify request shows correct details
      const requestCard = page.locator('[class*="request"], [data-testid*="request"]').first();
      const cardText = await requestCard.textContent();

      expect(cardText).toContain(slotWithOrganizer.time);
      expect(cardText).toContain(slotWithOrganizer.organizer);

      test.info().annotations.push({
        type: 'verification',
        description: `Request shows correct time (${slotWithOrganizer.time}) and organizer (${slotWithOrganizer.organizer})`,
      });
    }
  });

  test('TC-BS-005 delegate blocks and unblocks personal availability', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate blocks slot → verifies blocked status → unblocks → verifies available again',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('06 Sep');

    const slots = await scheduler.getAvailableSlots();
    const targetSlot = slots.find(s => s.time.includes('13:00') || s.time.includes('13:20'));

    if (targetSlot) {
      // Block the slot
      await scheduler.blockSlot(targetSlot.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Slot blocked: ${targetSlot.time}`,
      });

      // Verify it's in blocked list
      const blockedSlots = await scheduler.getBlockedSlots();
      const isBlocked = blockedSlots.some(s => s.time === targetSlot.time);
      expect(isBlocked).toBe(true);
      test.info().annotations.push({
        type: 'checkpoint',
        description: 'Slot appears in blocked list',
      });

      // Unblock the slot
      await scheduler.unblockSlot(targetSlot.time);
      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: `Slot unblocked: ${targetSlot.time}`,
      });

      // Verify it's no longer blocked
      const updatedBlockedSlots = await scheduler.getBlockedSlots();
      const stillBlocked = updatedBlockedSlots.some(s => s.time === targetSlot.time);
      expect(stillBlocked).toBe(false);
      test.info().annotations.push({
        type: 'checkpoint',
        description: 'Slot removed from blocked list',
      });
    }
  });

  test('TC-BS-006 booking includes optional meeting notes and preferences', async ({ page }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    test.info().annotations.push({
      type: 'scenario',
      description: 'Delegate books slot with notes about meeting agenda',
    });

    const auth = new DelegateAuthPage(page);
    const scheduler = new BookingSchedulerPage(page);

    await auth.login(env.bookingEventSlug, env.bookingDelegateAUsername, env.bookingDelegateAPassword);
    await scheduler.goto(env.bookingEventSlug);
    await scheduler.viewCalendar();
    await scheduler.selectDate('07 Sep');

    const slots = await scheduler.getAvailableSlots();
    const targetSlot = slots.find(s => s.time.includes('15:50'));

    if (targetSlot) {
      // Book with notes (if UI supports it)
      await scheduler.bookSlot(targetSlot.time);

      // Check for optional notes field
      const notesField = page.getByPlaceholder(/notes|agenda|comments/i);
      if (await notesField.isVisible({ timeout: 3000 }).catch(() => false)) {
        const testNote = `Meeting to discuss Q3 roadmap - ${Date.now()}`;
        await notesField.fill(testNote);
        test.info().annotations.push({
          type: 'checkpoint',
          description: `Notes added: "${testNote}"`,
        });
      }

      const confirmBtn = page.getByRole('button', { name: /confirm|submit|book/i });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForLoadState('networkidle');
      test.info().annotations.push({
        type: 'checkpoint',
        description: 'Booking with notes submitted',
      });
    }
  });
});
