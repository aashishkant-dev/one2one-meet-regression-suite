# Booking Tests

Complete booking workflow tests covering happy paths, edge cases, and concurrency scenarios.

## Test Files

### booking-happy-path.spec.ts (6 tests)
**TC-BS-001 through TC-BS-006** — Core booking workflows

- **TC-BS-001**: Single slot booking from start to finish
- **TC-BS-002**: Multiple bookings on same day
- **TC-BS-003**: Bookings across different dates
- **TC-BS-004**: Booking details verification (company, time, organizer)
- **TC-BS-005**: Block/unblock personal availability
- **TC-BS-006**: Booking with optional notes and preferences

### booking-edge-cases.spec.ts (planned)
**TC-BE-001 through TC-BE-010** — Error handling & boundaries

- Invalid time slots
- Expired time slots
- Slot availability boundaries
- Duplicate booking prevention
- Invalid delegate access
- Booking after event start

### booking-concurrency.spec.ts (planned)
**TC-BC-001 through TC-BC-008** — Concurrent booking scenarios

- Multiple delegates booking same slot
- Overbooking prevention
- Slot capacity limits
- Concurrent block/unblock
- Rapid booking sequences
- Booking under high load

## Test Data & Fixtures

All booking tests use:
- **Event**: Booking Test Event (06-07 Sep 2026)
- **Delegates**: BTE-BDC-alex, BTE-BEC-blake
- **Slots**: 48 available (09:00-17:00 daily)
- **Reserved slots**: 10:20, 10:40, 11:00, 12:20 on 06 Sep
- **Fresh slots for new tests**: 14:35, 15:05, 15:20, 15:35, 15:50, 16:05, 16:20, 16:35 (avoid reserved)

## Running Tests

```bash
# All booking tests
npx playwright test tests/comprehensive/booking

# Specific test file
npx playwright test tests/comprehensive/booking/booking-happy-path.spec.ts

# Single test
npx playwright test -g "TC-BS-001"

# Run with headed browser
npx playwright test tests/comprehensive/booking --headed
```

## Key Test Patterns

### 1. Step-by-step verification
```typescript
test('TC-BS-001 single slot booking', async ({ page }) => {
  // STEP 1: Login
  await auth.login(...);
  test.info().annotations.push({ type: 'checkpoint', description: 'Login successful' });
  
  // STEP 2: Navigate to scheduler
  await scheduler.goto(...);
  test.info().annotations.push({ type: 'checkpoint', description: 'Calendar loaded' });
  
  // STEP 3: Select date
  // ...
});
```

### 2. Fresh slot selection (avoid conflicts)
```typescript
// Find slot outside reserved times (10:20, 10:40, 11:00, 12:20)
const targetSlot = slots.find(s => s.time.includes('14:35') || s.time.includes('15:'));
```

### 3. Verification after booking
```typescript
// Check confirmation message
const successMsg = page.getByText(/request sent|booking confirmed/i);
await expect(successMsg).toBeVisible({ timeout: 10000 });

// Verify request appears in "My Meetings"
await myMeetingsTab.click();
const pendingRequest = page.locator('[class*="pending"]');
await expect(pendingRequest).toBeVisible();
```

## Common Assertions

| Assertion | Usage |
|-----------|-------|
| `expect(slots.length).toBeGreaterThan(0)` | Verify slots available |
| `expect(targetSlot).toBeTruthy()` | Verify specific slot exists |
| `await expect(successMsg).toBeVisible()` | Confirm booking success |
| `expect(isBlocked).toBe(true)` | Verify slot is blocked |
| `expect(cardText).toContain(time)` | Verify request details |

## Troubleshooting

### Slot Not Found
- Check reserved slots: 10:20, 10:40, 11:00, 12:20 on 06 Sep
- Use fresh times: 14:35+
- Try different date: 07 Sep has full availability

### Booking Confirmation Timeout
- Increase timeout: `{ timeout: 15000 }`
- Check for modal: "Do you want to confirm?" dialog
- Verify network: page load state before assertions

### Delegate Login Fails
- Verify credentials: BTE-BDC-alex, BTE-BEC-blake
- Check event slug: booking-test-event-6a78985de09a0
- Confirm delegate is active in event settings

## Performance Targets
- Single test: < 30 seconds
- All booking tests: < 5 minutes (headless)
- All with headed browser: < 8 minutes
