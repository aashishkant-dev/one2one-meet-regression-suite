# Excel Test Report - Quick Start Guide

## 🎯 What You Get

A **single Excel file** with all 29 test cases ready to fill in. Human-friendly format, easy to copy, easy to share.

---

## ⚡ Quick Start (2 minutes)

### Option 1: Auto-Generate with Python (Easiest)

```bash
cd C:\Users\QA.2\Desktop\one2one\ automation\concurrency-tests
python generate_test_report.py
```

**Done!** Opens: `Concurrency_Test_Report.xlsx`

### Option 2: Manual Creation (No Python Required)

If you don't have Python or openpyxl:
1. Create new Excel file
2. Follow the format below
3. Copy-paste the test cases from this document

---

## 📊 Excel File Structure

### Sheet 1: Instructions
Quick reference on how to use the report.

### Sheet 2: Test Results
All 29 test cases organized by category with columns:
- **Test ID**: TC-CC-001, etc
- **Test Name**: What the test does
- **Priority**: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM
- **Description**: What should happen
- **Status**: ☐ Pass ☐ Fail ☐ Not Tested
- **Actual Result**: What actually happened
- **Comments**: Notes, observations, errors

### Sheet 3: Summary
Auto-calculates:
- Total tests run
- Tests passed (green)
- Tests failed (red)
- Pass rate %

---

## 🎨 Easy to Use Format

```
Test ID      | Test Name                  | Priority    | Description              | Status | Actual Result | Comments
-------------|----------------------------|-------------|--------------------------|--------|---------------|----------
TC-CC-001    | Two delegates race...      | 🔴 CRITICAL | When two delegates...   | Pass   | Exactly one...| No issues
TC-CC-002    | Case 1 with autoAccept...  | 🔴 CRITICAL | Same race but with...   | Fail   | Both accepted | Double-book bug
```

---

## 👥 How to Fill In

### For Each Test:

1. **Status Column**: Choose one:
   - ✅ **Pass** - Test passed, works as expected
   - ❌ **Fail** - Test failed, bug found
   - ⏭️ **Not Tested** - Couldn't test (setup issue, etc)

2. **Actual Result**: Describe what you observed:
   - ✅ Good: "Exactly one delegate got the slot, other got clear rejection"
   - ❌ Bad: "Both delegates got confirmation - double booking possible!"
   - ⏭️ Skipped: "Test skipped due to login issues"

3. **Comments**: Add any extra notes:
   - Issue reference: "Bug #123"
   - Error message: "Timeout after 30 seconds"
   - Root cause: "Query not using database lock"
   - Performance: "Response time 2 seconds instead of 200ms"

---

## 💡 Example Filled-In Row

```
TC-CC-001
Two delegates race for same slot (autoAccept OFF)
🔴 CRITICAL
When two delegates book the same person's slot simultaneously, one wins and one loses
Pass
Exactly one request was accepted as PENDING. The losing delegate received immediate rejection message "This slot with [person] is no longer available"
Clean behavior. No double-booking. Response time: 245ms. Tested 5 times, 100% pass rate
```

---

## 📈 Summary Sheet (Auto-Calculated)

After you fill in the Status column, the Summary sheet auto-calculates:

```
Total Tests:           29
Tests Passed:          27  (counted automatically)
Tests Failed:          2   (counted automatically)
Not Tested:            0   (counted automatically)

Pass Rate:             93%  (auto-calculated)
```

---

## 🚀 Workflow

### Day 1: Setup
- [ ] Run: `python generate_test_report.py`
- [ ] OR manually create Excel following format
- [ ] Fill in: Date, Tester Name, Environment

### Day 2: Testing
- [ ] Open: `Concurrency_Test_Report.xlsx`
- [ ] Run: `.\run-tests.ps1` or `npm test`
- [ ] Fill in Status for each test as it runs
- [ ] Enter Actual Result while fresh in mind
- [ ] Add Comments immediately if issue found

### Day 3: Analysis
- [ ] Check Summary sheet - see your pass rate
- [ ] Review all "Fail" results
- [ ] Document any findings
- [ ] Save file with naming: `Concurrency_Results_[Date]_[Tester].xlsx`

### Day 4: Share
- [ ] Email file to team
- [ ] Share with stakeholders
- [ ] Use for release decision

---

## 📋 All 29 Test Cases (Reference)

### Case 1: Basic Delegate Races (4 tests)

**TC-CC-001** | Critical
Two delegates race for same slot (autoAccept OFF)
→ Exactly 1 winner, 1 clear loser rejection, no double-bookings

**TC-CC-002** | Critical  
Case 1 with autoAccept ON (24h timer)
→ Race resolved at request time (not deferred to timer)

**TC-CC-003** | High
Losing delegate retries next slot
→ Retry succeeds immediately without cooldown

**TC-CC-004** | Critical
N-way race (3, 5, 10 delegates)
→ Exactly 1 winner at any scale, reasonable response times

---

### Case 2: Sponsor Races (3 tests)

**TC-CC-005** | Critical
Two delegates race for sponsor slot (autoAccept OFF)
→ Single winner, table-level capacity maintained (1 per slot)

**TC-CC-006** | Critical
Sponsor race with autoAccept ON
→ Race resolved at request time

**TC-CC-007** | Critical
Fan-out scale (10-50 delegates)
→ Single winner at scale, server responsive for other bookings

---

### Case 3: Independent Bookings (2 tests)

**TC-CC-008** | High
Two independent bookings fired simultaneously
→ Both succeed, no cross-contamination, response time not 2x slower

**TC-CC-009** | High
50 independent bookings (25 pairs) in burst
→ All 50 succeed with correct attribution, no losses

---

### Session Races (7 tests)

**TC-CR-001** | High
Double-click Accept button
→ Only 1 confirmation created, button disabled or server rejects duplicate

**TC-CR-002** | High
Accept vs Reject from two sessions (same person, two devices)
→ Consistent final state after refresh

**TC-CR-003** | High
Request withdrawal vs acceptance race
→ No confirmed meeting from withdrawn request

**TC-CR-004** | High
Block slot vs simultaneous request
→ Either blocked OR pending (never both)

**TC-CR-005** | Critical ⚠️
Manual booking vs self-booking race
→ Cross-pathway integrity - only 1 booking succeeds

**TC-CR-006** | Medium
Auto Rejection setting changed mid-flight
→ Pre-existing requests preserved, only new requests follow new rule

**TC-CR-007** | Critical
Auto-accept batch race (20-50 requests)
→ All processed exactly once, correct single-winner resolution

---

### Event Setup Races (5 tests)

**TC-CE-001** | High
Duplicate event creation (slug collision)
→ Only 1 event created, duplicate rejected

**TC-CE-002** | High
Opposite status toggles (ON vs OFF)
→ Single consistent final state

**TC-CE-004** | High
Overlapping agenda blocks saved concurrently
→ Server catches overlap and rejects (not just client-side)

**TC-CE-005** | Medium
Agenda double-click save
→ Only 1 agenda created, not duplicate

**TC-CE-006** | Critical ⚠️
Agenda edit vs live booking race
→ Confirmed meetings protected, new bookings rejected cleanly

---

## 🆘 If Python Doesn't Work

### Install Python & openpyxl

```bash
# Check if Python installed
python --version

# If not installed, get it from python.org

# Install openpyxl
pip install openpyxl

# Then run
python generate_test_report.py
```

### If Still Stuck: Manual Excel Template

1. Create new Excel workbook
2. Create 3 sheets: "Instructions", "Test Results", "Summary"

3. On "Test Results" sheet, create headers:
   - A: Test ID
   - B: Test Name
   - C: Priority
   - D: Description
   - E: Status
   - F: Actual Result
   - G: Comments

4. Copy test cases from above into rows

5. Format:
   - Header row: Blue background, white text
   - Rows: Alternating white/light gray
   - Status column: Center-aligned
   - Description column: Wrap text

6. Save and start filling in results

---

## 💾 Saving Your Results

After testing, save as:
```
Concurrency_Results_[Date]_[YourName].xlsx
Example: Concurrency_Results_2026-01-15_QATeam.xlsx
```

This makes it easy to:
- Track testing history
- Compare results over time
- Find files in shared folders

---

## 📤 Sharing Results

### Email to Stakeholders:
- Attach Excel file
- Include Summary sheet (pass rate)
- Highlight any Critical failures

### Team Review:
- Share file on shared drive
- Discuss "Fail" results in team meeting
- Plan fixes based on root causes

### Archival:
- Keep copy in test results folder
- Reference for regression testing
- Evidence for release documentation

---

## ✅ Success Checklist

- [ ] Excel file created (`Concurrency_Test_Report.xlsx`)
- [ ] All 29 tests visible
- [ ] Date, Tester Name, Environment filled in
- [ ] Test Status column has: Pass, Fail, or Not Tested
- [ ] Actual Result describes what you observed
- [ ] Comments explain any issues
- [ ] Summary sheet shows pass rate
- [ ] File saved with meaningful name
- [ ] Ready to share with team

---

## 🎁 Pro Tips

1. **Color coding**: Excel will auto-format status:
   - Green = Pass ✅
   - Red = Fail ❌
   - Yellow = Not Tested ⏭️

2. **Copy-paste**: Actual Result column is wide - paste full descriptions

3. **Hyperlinks**: Use Ctrl+Click on test ID to quickly navigate

4. **Notes**: Keep running notes in Comments for quick patterns

5. **Timeline**: Fill in Status during test, Result/Comments immediately after

6. **Team**: Multiple testers? Create separate sheets per tester, then consolidate

---

## 📞 Questions?

- **How do I fill it in?** → See "How to Fill In" section
- **What do I put in Actual Result?** → See examples above
- **Python not working?** → Use Manual Excel Template
- **Summary sheet not calculating?** → Check Status column has exact text: "Pass" or "Fail"

---

## 🚀 Ready to Test?

1. Run: `python generate_test_report.py`
2. Open: `Concurrency_Test_Report.xlsx`
3. Fill in: Date, Tester Name, Environment
4. Run tests: `.\run-tests.ps1`
5. Fill in results as you go
6. Save when done
7. Share with your team!

---

**That's it! Super simple, super organized.** 📊✅
