# Concurrency Test Suite - Setup Checklist

## Pre-Flight Checklist ✅

Complete this checklist before running tests. Estimated time: 15 minutes.

---

## 1. Environment Prerequisites

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should show v18.x or higher
  ```

- [ ] **npm** available
  ```bash
  npm --version
  ```

- [ ] **Test environment accessible**
  - [ ] Can access the One2One Meet application
  - [ ] Application is stable (no ongoing maintenance)
  - [ ] Network connectivity confirmed

---

## 2. Extract Files

- [ ] Copy `concurrency-tests/` folder to your project directory
  ```
  C:\Users\QA.2\Desktop\one2one automation\concurrency-tests\
  ```

- [ ] Verify all files present:
  ```
  ✓ tests/ (7 .spec.ts files)
  ✓ fixtures/ (2 files)
  ✓ reporters/ (1 file)
  ✓ Configuration files (.ts, .json files)
  ✓ Documentation (README, QUICK_START, etc.)
  ```

---

## 3. Install Dependencies

- [ ] Open PowerShell/Terminal in concurrency-tests folder

- [ ] Run installation:
  ```bash
  npm install
  ```

- [ ] Verify Playwright installed:
  ```bash
  npx playwright --version
  ```

---

## 4. Update Test Credentials

### File: `global-setup.ts`

Find the `testAccounts` object:

```typescript
const testAccounts = {
  organizer: {
    email: 'organizer@techarttrekkies.com.np',  // ← CHANGE THIS
    password: 'TestPass@123',                    // ← CHANGE THIS
  },
  delegateA: {
    email: 'delegate.a@techarttrekkies.com.np',  // ← CHANGE THIS
    password: 'TestPass@123',                    // ← CHANGE THIS
  },
  delegateB: {
    email: 'delegate.b@techarttrekkies.com.np',  // ← CHANGE THIS
    password: 'TestPass@123',                    // ← CHANGE THIS
  },
  delegateC: {
    email: 'delegate.c@techarttrekkies.com.np',  // ← CHANGE THIS
    password: 'TestPass@123',                    // ← CHANGE THIS
  },
  sponsor: {
    email: 'sponsor@techarttrekkies.com.np',     // ← CHANGE THIS
    password: 'TestPass@123',                    // ← CHANGE THIS
  },
};
```

Tasks:
- [ ] Replace `organizer` email and password
- [ ] Replace `delegateA` email and password  
- [ ] Replace `delegateB` email and password
- [ ] Replace `delegateC` email and password
- [ ] Replace `sponsor` email and password

**Verification**: Try logging in to your app with these credentials manually - confirm they work

---

## 5. Update Application URL

### File: `playwright.config.ts`

Find this section:
```typescript
use: {
  baseURL: 'https://one2one.techarttrekkies.com.np',  // ← CHANGE THIS
}
```

Tasks:
- [ ] Replace with your actual application URL
- [ ] Ensure HTTPS (secure connection)
- [ ] **Do NOT include trailing slash** - just `https://app.com`
- [ ] Test URL is reachable:
  ```bash
  curl https://your-url.com
  ```

---

## 6. Identify Delegate IDs

Your test accounts need proper IDs in the database. You'll need to find:

### Method A: From Admin Panel
1. [ ] Log in as organizer
2. [ ] Go to Delegate Management / Users
3. [ ] Find each test delegate, note their ID
   - [ ] Delegate A ID: `______`
   - [ ] Delegate B ID: `______`
   - [ ] Delegate C ID: `______`
   - [ ] Delegate D ID (if used): `______`
   - [ ] Sponsor ID: `______`

### Method B: From Database/API
If available, query:
```sql
SELECT id, email, name FROM delegates 
WHERE email IN ('delegate.a@...', 'delegate.b@...', 'delegate.c@...');
```

---

## 7. Update Delegate IDs in Tests

Now replace all delegate IDs throughout the test files.

### Step 1: Search for placeholders
Current IDs used (placeholders):
- `3` = Delegate C
- `4` = Delegate D  
- `5` = Sponsor S1

### Step 2: Replace in each file

**File: `tests/01-case1-basic-race.spec.ts`**
- [ ] Find: `targetDelegateId = '3'`
- [ ] Replace with actual Delegate C ID

**File: `tests/02-case1-nway-race.spec.ts`**
- [ ] Find: `targetDelegateId = '3'`
- [ ] Replace with actual Delegate C ID

**File: `tests/03-case2-sponsor-race.spec.ts`**
- [ ] Find: `sponsorId = '1'`
- [ ] Replace with actual Sponsor S1 ID

**File: `tests/04-case3-isolation.spec.ts`**
- [ ] Find: `/delegates/3/slots`
- [ ] Replace `3` with actual Delegate C ID
- [ ] Find: `/delegates/4/slots`
- [ ] Replace `4` with actual Delegate D ID

**File: `tests/05-idempotency-session-races.spec.ts`**
- [ ] Find: `/delegates/3/slots`
- [ ] Replace all occurrences

**File: `tests/06-advanced-races.spec.ts`**
- [ ] Find: `/delegates/3/slots`, `/delegates/4/slots`
- [ ] Replace all occurrences

**File: `tests/07-event-setup-races.spec.ts`**
- [ ] Find: `/sponsor/1/slots`
- [ ] Replace `1` with actual Sponsor ID

### Verification Shortcut
Use find/replace in editor:
- Search: `'/delegates/3/`
- Replace: `'/delegates/YOUR_DELEGATE_C_ID/`

Repeat for `4` (Delegate D) and `1` (Sponsor)

---

## 8. Verify Test Event Setup

Tests assume a test event exists with available time slots.

Check:
- [ ] Test event exists (e.g., "Tech Expo Kathmandu")
- [ ] Event status: **Active**
- [ ] Booking window: **Open**
- [ ] Available slots: **Multiple time slots free**
  - [ ] 10:00-10:15 (or similar 15-min slot)
  - [ ] 10:20-10:35 (next available)
  - [ ] 11:00-11:15 (for sponsor tests)

If slots don't exist:
1. Log in as organizer
2. Go to Timeslots & Agenda
3. Add meeting blocks for test day
4. Generate slots with 15-minute duration

---

## 9. Run Quick Validation

Before full test suite, run a quick check:

```bash
npx playwright codegen https://YOUR_APP_URL.com
```

This opens browser automation tool. Test:
- [ ] Can you log in with test credentials?
- [ ] Can you navigate to delegate profiles?
- [ ] Can you see available slots?

If any step fails, fix before proceeding.

---

## 10. Pre-Test Database Cleanup

Optional but recommended: clear old test data

Tasks:
- [ ] Delete old test events (from previous runs)
- [ ] Clear pending requests older than 30 days
- [ ] Verify no locks on test delegates' accounts

---

## 11. Final Verification

Run this quick test:

```bash
npm test tests/01-case1-basic-race.spec.ts --grep "TC-CC-001"
```

Expected outcome:
- [ ] Browser opens
- [ ] Logs in successfully
- [ ] Navigates to slots
- [ ] Test completes (pass or fail)
- [ ] Results appear in console

If successful → ✅ **Ready to run full suite!**

---

## 12. Optional: Configure for Headless Mode

For CI/CD or background execution:

- [ ] Keep `headless: true` in `playwright.config.ts`
- [ ] Set `timeout: 30000` for page loads
- [ ] Enable `trace: 'on-first-retry'` for failure debugging

---

## 13. Optional: Setup Results Upload

To auto-upload results after tests:

Edit `package.json`:
```json
"test": "playwright test && node scripts/upload-results.js"
```

Then create `scripts/upload-results.js` to send results to your server/email.

---

## Pre-Flight Final Check

Before running tests, answer:

- [ ] All credentials updated? ✅ Yes / ❌ No
- [ ] Application URL verified? ✅ Yes / ❌ No
- [ ] Delegate IDs found and updated? ✅ Yes / ❌ No
- [ ] Test event created with slots? ✅ Yes / ❌ No
- [ ] Quick validation test passed? ✅ Yes / ❌ No
- [ ] All dependencies installed? ✅ Yes / ❌ No

**If all checkmarks are YES → Ready to run tests!**

---

## Execution Steps

When ready, run:

### Option 1: Interactive Menu (Recommended)
```bash
.\run-tests.ps1
```

### Option 2: Full Suite
```bash
npm test
```

### Option 3: Specific Category
```bash
npm run test:cc    # Case 1-3 races
npm run test:cr    # Session races
npm run test:ce    # Event setup races
```

---

## Expected Execution Time

| Test Category | Time | Tests |
|--------------|------|-------|
| Full Suite | 25-30 min | 29 cases |
| Case 1-2 Only | 5-8 min | 9 cases |
| Session Races | 8-12 min | 7 cases |
| Event Setup | 6-10 min | 5 cases |

---

## Common Setup Errors & Fixes

### Error: "Cannot find module '@playwright/test'"
```bash
Solution: npm install
```

### Error: "User not found" during login
```bash
Solution: Check credentials in global-setup.ts match your test environment
```

### Error: "Selector not found"
```bash
Solution: Update delegate IDs in test files
Open app > Inspect element > find correct selectors
```

### Error: "Connection refused"
```bash
Solution: Verify baseURL in playwright.config.ts
Check application is running and accessible
```

### Error: "Browser crash"
```bash
Solution: Increase timeout values
Ensure system has enough memory (500MB+ free)
Close other browser instances
```

---

## Success Confirmation

✅ When you see this message:
```
✓ Test execution completed in XXm YYs
📊 Results saved to:
   • CSV: test-reports/concurrency-test-results.csv
   • TSV: test-reports/concurrency-test-results.tsv
```

**You're done! Results are ready to copy to Excel.**

---

## Next Steps After Tests Complete

1. Open `test-reports/concurrency-test-results.tsv`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Open your Excel sheet
4. Select the "Actual Result" column
5. Paste (Ctrl+V)
6. Review results and document any failures

---

## Estimated Total Time

| Task | Time |
|------|------|
| Setup & Configuration | 15 min |
| Running Tests | 25-30 min |
| Reviewing Results | 10 min |
| Copying to Excel | 5 min |
| **TOTAL** | **~1 hour** |

---

## Troubleshooting Resources

If stuck:
1. Check `README.md` - Full technical documentation
2. Check `TEST_CASES_IMPLEMENTED.md` - Case-specific details
3. Review test file comments - Inline documentation
4. Check original Excel spec - Business requirements

---

**You're all set! Follow this checklist and you'll be running concurrency tests in no time.** 🚀

Print this page or save as reference during setup process.
