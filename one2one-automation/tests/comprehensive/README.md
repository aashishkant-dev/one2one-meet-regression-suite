# Comprehensive Test Suite

Detailed regression tests covering booking workflows, meeting request lifecycle, concurrency scenarios, and edge cases.

## Organization

```
comprehensive/
├── README.md (this file)
├── booking/
│   ├── README.md
│   ├── booking-happy-path.spec.ts          # Basic booking flow
│   ├── booking-edge-cases.spec.ts          # Edge cases & error handling
│   └── booking-concurrency.spec.ts         # Simultaneous booking races
├── meeting-requests/
│   ├── README.md
│   ├── request-lifecycle.spec.ts           # Complete request workflow
│   ├── request-concurrency.spec.ts         # Concurrent accept/reject races
│   └── request-notifications.spec.ts       # Email & notification verification
├── event-state/
│   ├── README.md
│   └── event-access-control.spec.ts        # Past/current/future event gates
└── advanced/
    ├── README.md
    ├── race-conditions.spec.ts             # High-concurrency race scenarios
    └── stress-scenarios.spec.ts            # Stress & load testing
```

## Test Categories

### 📌 Booking Tests (booking/)
- **booking-happy-path.spec.ts**: Core booking workflow (calendar → slot → request → confirmation)
- **booking-edge-cases.spec.ts**: Error handling, validation, boundary conditions
- **booking-concurrency.spec.ts**: Simultaneous bookings, slot conflicts, deduplication

### 📌 Meeting Request Tests (meeting-requests/)
- **request-lifecycle.spec.ts**: Full lifecycle (send → pending → approve/reject → confirmed/cancelled)
- **request-concurrency.spec.ts**: Simultaneous acceptance, double-accept prevention, race conditions
- **request-notifications.spec.ts**: Email alerts, notification badges, real-time updates

### 📌 Event State Tests (event-state/)
- **event-access-control.spec.ts**: Time-based gates, access control, read-only modes

### 📌 Advanced Tests (advanced/)
- **race-conditions.spec.ts**: Complex multi-party races, deadlock scenarios
- **stress-scenarios.spec.ts**: Load testing, performance under high concurrency

## Running Tests

```bash
# All comprehensive tests
npx playwright test tests/comprehensive

# Specific module
npx playwright test tests/comprehensive/booking
npx playwright test tests/comprehensive/meeting-requests
npx playwright test tests/comprehensive/event-state
npx playwright test tests/comprehensive/advanced

# Specific test file
npx playwright test tests/comprehensive/booking/booking-concurrency.spec.ts

# Single test by TC-ID
npx playwright test -g "TC-BS-001"
```

## Test Naming Convention

Format: `TC-[MODULE]-[NUMBER]`

**Modules:**
- `BS` = Booking Scheduler
- `BC` = Booking Concurrency
- `MR` = Meeting Request
- `MC` = Meeting Concurrency
- `RC` = Race Condition
- `EA` = Event Access

Example: `TC-MC-003` = Meeting Concurrency test #3

## Key Scenarios Covered

### Concurrency
- Simultaneous slot bookings (same time slot, different delegates)
- Concurrent request acceptance (multiple delegates accepting same request)
- Double-accept prevention (idempotency)
- Accept vs Reject races
- Rapid sequential operations

### Edge Cases
- Booking after event starts
- Booking expired time slots
- Invalid delegate access
- Network timeout recovery
- Duplicate request submission
- Slot availability countdown

### Data Consistency
- State verification post-race
- Request de-duplication
- Confirmed meeting integrity
- Notification delivery guarantees

## Environment & Fixtures

All tests use:
- **Staging environment** (https://one2one.techarttrekkies.com.np)
- **Pre-seeded events** (booking, current, past)
- **Test delegate accounts** (BTE-BDC-alex, BTE-BEC-blake)
- **Mailpit integration** (email verification)

## Assumptions

1. **Booking Test Event** has 48 available slots (06-07 Sep, 09:00-17:00)
2. **Known consumed slots**: 10:20, 10:40, 11:00, 12:20 on 06 Sep (from prior runs)
3. **New tests use fresh slots**: 14:35+ to avoid collisions
4. **Event timestamps** are pre-provisioned (immutable for test consistency)
5. **Delegate accounts** are pre-created with access to Booking Test Event

## Performance Targets

- **Single test**: < 30 seconds
- **Module** (10-15 tests): < 5 minutes
- **All comprehensive tests** (80+ tests): < 12 minutes headless

## Notes

- Tests are idempotent (safe to re-run)
- All async operations use explicit timeouts
- Resource cleanup via try/finally blocks
- Parallel-safe via Date.now() suffixes
- No shared state between tests
