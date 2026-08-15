# One2One Meet - Concurrency & Race Condition Test Suite

Comprehensive Playwright automation suite for testing concurrency issues, race conditions, and idempotency in the One2One Meet application.

## Overview

This test suite implements all test cases from the **Concurrency - Race Conditions** module (TC-CC-001 through TC-CE-010) of the One2One Meet Test Cases document.

### Test Categories

#### Case 1: Basic Race Conditions (TC-CC-001 to TC-CC-004)
- **TC-CC-001**: Two delegates simultaneously request same delegate's slot (autoAccept OFF)
- **TC-CC-002**: Same scenario with autoAccept ON (24h timer)
- **TC-CC-003**: Losing delegate retries on next available slot
- **TC-CC-004**: N-way race (3, 5, 10 delegates) for single slot

#### Case 2: Sponsor Races (TC-CC-005 to TC-CC-007)
- **TC-CC-005**: Two delegates race for sponsor's slot (autoAccept OFF)
- **TC-CC-006**: Sponsor race with autoAccept ON (24h timer)
- **TC-CC-007**: Fan-out scale (10-50 delegates) competing for sponsor slot

#### Case 3: Isolation & Cross-Contamination (TC-CC-008 to TC-CC-009)
- **TC-CC-008**: Independent, non-conflicting bookings fired simultaneously
- **TC-CC-009**: 50 independent bookings (25 pairs) in burst

#### Idempotency & Session Races (TC-CR-001 to TC-CR-003)
- **TC-CR-001**: Double-click Accept button idempotency
- **TC-CR-002**: Accept vs Reject race from two sessions
- **TC-CR-003**: Request withdrawal vs acceptance race

#### Advanced Races (TC-CR-004 to TC-CR-006)
- **TC-CR-004**: Block slot vs simultaneous request race
- **TC-CR-005**: Organizer manual booking vs delegate self-booking race
- **TC-CR-006**: Auto Rejection setting change while requests in-flight

#### Event Setup Races (TC-CE-001 to TC-CE-006)
- **TC-CE-001**: Duplicate event creation with identical name (slug collision)
- **TC-CE-002**: Opposite status toggles (ON vs OFF) simultaneously
- **TC-CE-004**: Overlapping agenda blocks saved concurrently
- **TC-CE-005**: Agenda double-click save (idempotency)
- **TC-CE-006**: Agenda edit vs live booking race

## Setup

### Prerequisites

- Node.js 18+ installed
- Playwright 1.40+ (installed via npm)
- Test accounts set up in the One2One Meet application:
  - Organizer account
  - 4+ delegate accounts (A, B, C, D)
  - Sponsor account (S1)
  - Test event created with available time slots

### Installation

```bash
cd concurrency-tests
npm install
```

### Configuration

1. **Update test credentials** in `global-setup.ts`:
   ```typescript
   const testAccounts = {
     organizer: { email: 'your-organizer@domain.com', password: 'password' },
     delegateA: { email: 'delegate.a@domain.com', password: 'password' },
     delegateB: { email: 'delegate.b@domain.com', password: 'password' },
     delegateC: { email: 'delegate.c@domain.com', password: 'password' },
     sponsor: { email: 'sponsor@domain.com', password: 'password' },
   };
   ```

2. **Set the base URL** in `playwright.config.ts`:
   ```typescript
   use: {
     baseURL: 'https://your-app-url.com',
   }
   ```

3. **Adjust delegate/sponsor IDs** in test files:
   - Replace delegate IDs (currently 3, 4, 5) with actual IDs from your test environment
   - Update slot times to match available slots in your test event

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Case 1 & 2 races (basic and sponsor)
npm run test:cc

# Session and idempotency races
npm run test:cr

# Event setup races
npm run test:ce

# Run in headed mode (see browser)
npm run test:headed

# Debug mode with breakpoints
npm run test:debug
```

### Run Individual Tests
```bash
npx playwright test tests/01-case1-basic-race.spec.ts
npx playwright test tests/03-case2-sponsor-race.spec.ts --grep "TC-CC-005"
```

## Test Results

### Report Generation

Tests automatically generate three output formats:

1. **HTML Report** (interactive)
   ```bash
   npm run test:report
   ```
   Opens detailed HTML report with video/screenshot evidence

2. **CSV Export** (`test-reports/concurrency-test-results.csv`)
   - Easily importable into Excel
   - Contains: Test Case ID, Status, Actual Result, Comments, Timestamp

3. **TSV Export** (`test-reports/concurrency-test-results.tsv`)
   - Tab-separated for Excel paste
   - Quick format for copying results to spreadsheet

### Copying Results to Excel

1. Run all tests:
   ```bash
   npm test
   ```

2. Open `test-reports/concurrency-test-results.tsv`

3. Copy the content (excluding headers if already in your sheet)

4. Paste into the **Actual Result** and **Status** columns in the Excel file

5. The timestamp and test case IDs match the Excel structure

## Test Structure

### Directory Layout
```
concurrency-tests/
├── tests/                          # Test specifications
│   ├── 01-case1-basic-race.spec.ts
│   ├── 02-case1-nway-race.spec.ts
│   ├── 03-case2-sponsor-race.spec.ts
│   ├── 04-case3-isolation.spec.ts
│   ├── 05-idempotency-session-races.spec.ts
│   ├── 06-advanced-races.spec.ts
│   └── 07-event-setup-races.spec.ts
├── fixtures/                       # Reusable test helpers
│   ├── auth.ts                     # Login/logout functions
│   └── concurrent-helpers.ts       # Parallel request utilities
├── reporters/                      # Custom reporters
│   └── concurrency-reporter.ts     # Results formatter
├── playwright.config.ts            # Playwright configuration
├── global-setup.ts                 # Test data setup
└── test-data.json                  # Generated test accounts
```

### Key Fixtures

#### `auth.ts`
- `loginAs(page, email, password)` - Log in as user
- `logout(page)` - Log out user
- `getAuthToken(page)` - Extract auth token from cookies

#### `concurrent-helpers.ts`
- `fireParallel(requests, delayMs)` - Execute actions concurrently
- `countSuccessful(results)` - Count passed actions
- `clickParallel(pages, selector)` - Click button on multiple pages
- `verifyStateParallel(pages, selector)` - Check state across pages

## Interpreting Results

### Test Status Values

| Status | Meaning |
|--------|---------|
| **Pass** | Test executed, race conditions handled correctly, data integrity maintained |
| **Fail** | Race condition detected, data corruption, or integrity violation |
| **Not Tested** | Test not executed (manual setup required or environment constraint) |

### Sample Actual Result Formats

**Pass Example:**
```
PASS: Exactly one request was accepted. Slot integrity maintained. 
Winner received confirmation, loser received clear rejection message.
```

**Fail Example:**
```
FAIL: Both requests were accepted. Race condition detected - double booking possible!
```

**Partial Pass Example:**
```
PARTIAL: Setting change observed, but pre-existing request handling needs verification. 
Expected: only NEW requests auto-rejected, existing ones preserved unless documented.
```

## Known Limitations

### Tests Requiring Manual Setup

Some tests require environmental setup that isn't automated:

1. **24-hour Auto-Accept Timer Tests** (TC-CC-002, TC-CC-006)
   - Requires either: waiting 24 hours OR using staging/test endpoint to advance time
   - Test verifies race resolves at request time (not deferred to timer)

2. **Batch Auto-Accept Processing** (TC-CR-007)
   - Requires staging environment with batch-job trigger endpoint
   - Test verifies batch setup and count reconciliation

3. **Delegate IDs and Slot Times**
   - Must be updated to match your test environment
   - See "Configuration" section above

### Performance Considerations

- Tests with N=50+ concurrent requests may take 30-60 seconds
- Recommended: Run on dedicated testing environment to avoid load on production
- Browser contexts are created and destroyed per test (memory intensive)

## Troubleshooting

### Common Issues

**Issue**: "Cannot find user with email..."
- **Solution**: Verify test account credentials in `global-setup.ts` match your environment

**Issue**: "Selector not found" errors
- **Solution**: Update CSS selectors (`[data-testid]` attributes) to match your application
- Use browser DevTools to find correct selectors

**Issue**: Tests timeout
- **Solution**: Increase timeouts in tests (currently 10s for page loads, 30s for requests)
- Verify network connectivity and application responsiveness

**Issue**: "Port already in use" or context creation fails
- **Solution**: Ensure Playwright dependencies are correctly installed
- Run: `npx playwright install`

## Performance Metrics

Recorded in test results:

- **Response Time**: Milliseconds for each concurrent action
- **Success Count**: Number of concurrent requests that succeeded
- **Race Resolution**: Whether single-winner guarantee maintained

## Extending Tests

### Adding New Test Cases

1. Create new file: `tests/XX-description.spec.ts`

2. Use existing patterns:
```typescript
test('TC-NEW-001: Description', async ({ browser }) => {
  const testCaseId = 'TC-NEW-001';
  let actualResult = '';
  let status = 'Not Tested';

  try {
    // Your test logic here
    actualResult = 'PASS: Description of what passed';
    status = 'Pass';
  } catch (error) {
    actualResult = `ERROR: ${error}`;
    status = 'Fail';
  }

  console.log(`${testCaseId}: ${status}`);
  expect(status).toBe('Pass');
});
```

3. Results automatically included in reports

## Support

For issues with specific test cases, refer to the original test case document:
- Look up test ID (e.g., TC-CC-001) in "One2One_Meet_TestCases_Merged (2).xlsx"
- Check "Good to Know" section for manual testing guidance
- Verify all pre-conditions and test data setup

## License

Proprietary - One2One Meet Testing Suite

## Version History

- **v1.0.0** (2026-01-08): Initial implementation of all concurrency test cases
  - TC-CC-001 through TC-CC-009 (Case 1-3 races)
  - TC-CR-001 through TC-CR-007 (Session and idempotency races)
  - TC-CE-001 through TC-CE-006 (Event setup races)
