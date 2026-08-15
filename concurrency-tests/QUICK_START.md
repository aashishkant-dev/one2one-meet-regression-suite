# Quick Start Guide - Concurrency Tests

## 30-Second Setup

### 1. Install Dependencies
```bash
cd C:\Users\QA.2\Desktop\one2one\ automation\concurrency-tests
npm install
```

### 2. Update Test Credentials
Edit `global-setup.ts` and update:
```typescript
const testAccounts = {
  organizer: { email: 'YOUR_ORG@domain.com', password: 'YOUR_PASSWORD' },
  delegateA: { email: 'YOUR_DELEGATE_A@domain.com', password: 'YOUR_PASSWORD' },
  delegateB: { email: 'YOUR_DELEGATE_B@domain.com', password: 'YOUR_PASSWORD' },
  delegateC: { email: 'YOUR_DELEGATE_C@domain.com', password: 'YOUR_PASSWORD' },
  sponsor: { email: 'YOUR_SPONSOR@domain.com', password: 'YOUR_PASSWORD' },
};
```

### 3. Update Application URLs in `playwright.config.ts`
```typescript
baseURL: 'https://YOUR_APP_URL.com'
```

### 4. Update Delegate IDs in Test Files
Search and replace delegate IDs in all test files:
- Current: IDs 3, 4, 5
- Replace with: Your actual delegate IDs from the application

### 5. Run Tests
```bash
npm test
```

## Running Specific Test Groups

```bash
# Run only Case 1 & 2 (basic and sponsor races)
npm run test:cc

# Run only session races
npm run test:cr

# Run only event setup races
npm run test:ce

# Run with browser visible
npm run test:headed
```

## Getting Results

Tests automatically generate results in:
- `test-reports/concurrency-test-results.csv` - Excel-ready format
- `test-reports/concurrency-test-results.tsv` - Tab-separated for paste
- `test-reports/concurrency-test-results.json` - JSON format

### Copying to Excel

1. After tests complete, open: `test-reports/concurrency-test-results.tsv`
2. Copy all content (Ctrl+A, Ctrl+C)
3. In Excel, select the "Actual Result" column in your test sheet
4. Paste (Ctrl+V)

## Test Execution Time

- Full suite: ~15-30 minutes
- Basic races only: ~5 minutes
- Single test: ~1-2 minutes

## Troubleshooting

### Error: "Cannot find user"
→ Check credentials in `global-setup.ts` match your test environment

### Error: "Selector not found"
→ Update CSS selectors in test files to match your application's HTML

### Error: "Connection refused"
→ Verify `baseURL` in `playwright.config.ts` is correct and accessible

### Error: "Tests timing out"
→ Increase timeout values (currently 10s for page loads, 30s for requests)

## What Each Test Category Tests

### TC-CC (Case 1-3: Booking Races)
- Two people booking same slot at same time
- Many people racing for one popular slot
- Non-conflicting bookings fired simultaneously
- **Expected**: Single winner, clear loser rejection, no double-booking

### TC-CR (Session Races & Idempotency)
- Double-clicking buttons (idempotency)
- Same person logged in twice, opposing actions
- Request withdrawal vs acceptance race
- Block vs request race
- Manual booking vs self-booking race
- **Expected**: Atomic resolution, no contradictory states

### TC-CE (Event/Agenda Races)
- Creating events with duplicate names (slug collision)
- Toggling event status opposite ways simultaneously
- Overlapping agenda blocks saved at same time
- Editing agenda while someone is booking
- **Expected**: Conflict detection, no duplicates/overlaps

## File Structure Created

```
concurrency-tests/
├── tests/                       # 7 test spec files
├── fixtures/                    # Reusable helpers
├── reporters/                   # Custom result formatter
├── test-reports/               # Generated after running tests
├── playwright.config.ts        # Configuration
├── global-setup.ts             # Test account setup
├── package.json
├── tsconfig.json
├── README.md                   # Full documentation
└── QUICK_START.md             # This file
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Update credentials and URLs
3. ✅ Update delegate IDs
4. ✅ Run tests: `npm test`
5. ✅ Check results in `test-reports/`
6. ✅ Copy results to Excel

## Support Resources

- **Full Documentation**: See `README.md`
- **Test Details**: Check corresponding `.spec.ts` file
- **Original Test Cases**: `One2One_Meet_TestCases_Merged (2).xlsx` - Concurrency sheet

---

**Estimated Time**: 
- First-time setup: 15 minutes
- Running full test suite: 20-30 minutes
- Copying results to Excel: 5 minutes

**Total**: ~50 minutes for complete test execution and results export
