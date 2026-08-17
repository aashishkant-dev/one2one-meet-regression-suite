import { Page, Locator } from '@playwright/test';

export interface TimeSlot {
  date: string;      // '06 Sep', '07 Sep', etc.
  time: string;      // '10:20 TO 10:35', '10:40 TO 10:55', etc.
  organizer: string; // 'QA Automation', etc.
  status: 'available' | 'booked' | 'blocked';
}

export class BookingSchedulerPage {
  constructor(private page: Page) {}

  async goto(eventSlug: string) {
    await this.page.goto(`/${eventSlug}`);
    await this.page.waitForLoadState('networkidle');
  }

  // Calendar/Scheduler View
  async viewCalendar() {
    const calendarBtn = this.page.getByRole('button', { name: /calendar|schedule|view schedule/i });
    if (await calendarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calendarBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async selectDate(dateLabel: string) {
    // Date button format: "06 Sep", "07 Sep", etc.
    await this.page.getByRole('button', { name: new RegExp(dateLabel, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getAvailableSlots(): Promise<TimeSlot[]> {
    // Returns all open/available slots for the selected date
    const slots: TimeSlot[] = [];
    const slotCards = this.page.locator('[data-testid="available-slot"], .slot-card.available, [class*="Slot"][class*="available"]');
    const count = await slotCards.count();

    for (let i = 0; i < count; i++) {
      const card = slotCards.nth(i);
      const timeText = await card.locator('[class*="time"], .time-range').textContent();
      const organizerText = await card.locator('[class*="organizer"], .organizer-name').textContent();

      if (timeText && organizerText) {
        slots.push({
          date: '', // extracted from context, set separately if needed
          time: timeText.trim(),
          organizer: organizerText.trim(),
          status: 'available',
        });
      }
    }

    return slots;
  }

  async getBookedSlots(): Promise<TimeSlot[]> {
    // Returns all booked/unavailable slots
    const slots: TimeSlot[] = [];
    const slotCards = this.page.locator('[data-testid="booked-slot"], .slot-card.booked, [class*="Slot"][class*="booked"]');
    const count = await slotCards.count();

    for (let i = 0; i < count; i++) {
      const card = slotCards.nth(i);
      const timeText = await card.locator('[class*="time"], .time-range').textContent();
      const organizerText = await card.locator('[class*="organizer"], .organizer-name').textContent();

      if (timeText && organizerText) {
        slots.push({
          date: '',
          time: timeText.trim(),
          organizer: organizerText.trim(),
          status: 'booked',
        });
      }
    }

    return slots;
  }

  async getBlockedSlots(): Promise<TimeSlot[]> {
    // Returns all slots blocked by the delegate
    const slots: TimeSlot[] = [];
    const slotCards = this.page.locator('[data-testid="blocked-slot"], .slot-card.blocked, [class*="Slot"][class*="blocked"]');
    const count = await slotCards.count();

    for (let i = 0; i < count; i++) {
      const card = slotCards.nth(i);
      const timeText = await card.locator('[class*="time"], .time-range').textContent();

      if (timeText) {
        slots.push({
          date: '',
          time: timeText.trim(),
          organizer: 'N/A',
          status: 'blocked',
        });
      }
    }

    return slots;
  }

  // Slot Interaction
  async bookSlot(timeLabel: string) {
    // timeLabel format: "10:20 TO 10:35"
    const slotCard = this.page.locator('[class*="slot"]', { hasText: timeLabel }).first();
    const bookBtn = slotCard.getByRole('button', { name: /book|request|schedule/i });

    if (await bookBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    } else {
      throw new Error(`Cannot book slot "${timeLabel}" - Book button not found or disabled`);
    }
  }

  async blockSlot(timeLabel: string) {
    // Block personal availability (prevent organizers from booking)
    const slotCard = this.page.locator('[class*="slot"]', { hasText: timeLabel }).first();
    const blockBtn = slotCard.getByRole('button', { name: /block|unavailable/i });

    if (await blockBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await blockBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    } else {
      throw new Error(`Cannot block slot "${timeLabel}" - Block button not found`);
    }
  }

  async unblockSlot(timeLabel: string) {
    // Unblock a previously blocked slot
    const slotCard = this.page.locator('[class*="slot"]', { hasText: timeLabel }).first();
    const unblockBtn = slotCard.getByRole('button', { name: /unblock|available/i });

    if (await unblockBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await unblockBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  // Multi-select (if supported)
  async selectMultipleSlots(timeLabels: string[]) {
    // If the app supports multi-select drag-to-select or Ctrl+click
    for (const timeLabel of timeLabels) {
      const slotCard = this.page.locator('[class*="slot"]', { hasText: timeLabel }).first();
      await slotCard.click({ modifiers: ['Control'] });
    }
  }

  // Assertions
  async expectSlotAvailable(timeLabel: string) {
    const slots = await this.getAvailableSlots();
    const found = slots.some(s => s.time.includes(timeLabel));
    if (!found) {
      throw new Error(`Slot "${timeLabel}" is not available`);
    }
  }

  async expectSlotBooked(timeLabel: string) {
    const slots = await this.getBookedSlots();
    const found = slots.some(s => s.time.includes(timeLabel));
    if (!found) {
      throw new Error(`Slot "${timeLabel}" is not booked`);
    }
  }

  async expectNoAvailableSlots() {
    const slots = await this.getAvailableSlots();
    if (slots.length > 0) {
      throw new Error(`Expected no available slots, but found ${slots.length}`);
    }
  }

  async expectSchedulerMessage(messagePattern: RegExp) {
    await this.page
      .getByText(messagePattern)
      .first()
      .waitFor({ timeout: 5000 });
  }

  // Utility
  slotLocator(timeLabel: string): Locator {
    return this.page.locator('[class*="slot"]', { hasText: timeLabel }).first();
  }

  availableSlotsContainer(): Locator {
    return this.page.locator('[data-testid="available-slots"], [class*="AvailableSlots"], .slots-container');
  }

  schedulerTitle(): Locator {
    return this.page.locator('h1, h2', { hasText: /schedule|calendar|timeslot/i });
  }
}
