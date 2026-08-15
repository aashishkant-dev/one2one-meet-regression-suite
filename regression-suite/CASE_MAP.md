# Test Case Traceability Map

Maps every TC-ID in this automated smoke suite back to its spec file, and shows how much
of the full 216-case register (`../master-test-register.html`) each module currently has
automated coverage for. This is the file to check when someone asks "is TC-XX-NNN covered
by CI, and if it fails, which file do I look at?"

Full case detail (steps, test data, expected result, original manual Pass/Fail/Comments from
the 2026-06-18–22 execution pass) lives in `../master-test-register.html` — open it in a
browser and use its search box with the TC-ID.

| Module | Automated / Total | Spec file | TC-IDs covered |
|---|---|---|---|
| Event Management | 3 / 10 | `tests/core/event-management.spec.ts` | TC-EV-001, TC-EV-N01, TC-EV-006 |
| Delegate Management | 3 / 22 | `tests/core/delegate-management.spec.ts` | TC-DM-001, TC-DM-N04, TC-DM-006 |
| Access Types | 3 / 9 | `tests/core/access-types.spec.ts` | TC-AT-001, TC-AT-002, TC-AT-N01 |
| Sponsor Categories | 2 / 8 | `tests/core/sponsor-categories.spec.ts` | TC-SC-004, TC-SC-N02 |
| Sponsors | 2 / 11 | `tests/core/sponsors.spec.ts` | TC-SP-001, TC-SP-002 |
| Timeslots & Agenda | 3 / 18 | `tests/core/timeslots-agenda.spec.ts` | TC-TS-001, TC-TS-N01, TC-AG-003 |
| Registration Links | 2 / 8 | `tests/core/registration-links.spec.ts` | TC-RL-001, TC-RL-N01 |
| Table Configuration | 2 / 9 | `tests/core/table-configuration.spec.ts` | TC-TC-003, TC-TC-004 |
| Meeting Booking & Requests | 2 automated + 1 skipped / 24 | `tests/core/meeting-booking.spec.ts` | TC-MB-002, TC-MB-014/TC-MB-N03, TC-MB-N01 (skip, documented reason) |
| Manual Booking | 1 / 10 | `tests/core/manual-booking.spec.ts` | TC-MN-003/TC-MN-N01 |
| Announcements & Feedback | 2 / 11 | `tests/core/announcements-feedback.spec.ts` | TC-AN-001, TC-AN-N01 |
| Live Meetings Monitor | 1 / 8 | `tests/core/live-meetings.spec.ts` | TC-LM-N01 |
| Reports | 2 / 9 | `tests/core/reports.spec.ts` | TC-RP-001, TC-RP-003 |
| Delegate Login & Profile | 4 / 11 | `tests/core/delegate-login.spec.ts` | TC-DL-001, TC-DL-N01, TC-DL-N02, TC-DL-N03 |
| Settings (toggle gap coverage) | 3 automated + 3 skipped / 6 | `tests/core/meeting-settings.spec.ts` | TC-SG-003, TC-SG-004, TC-SG-005 (TC-SG-001/002/006 skipped, documented reason in-file) |
| **Core Functional total** | **36 / 160** | | |
| Concurrency & Race Conditions | 10 / 33 | `tests/core/concurrency.spec.ts` | TC-CC-001, TC-CC-008, TC-CC-003, TC-CE-011, TC-CE-008, TC-CE-001, TC-CR-001, TC-CR-004, TC-CR-002, TC-CE-009 |
| Settings - Account Danger Zone | 0 / 5 | — not yet automated | |
| Meeting Request Lifecycle | 0 / 8 | — not yet automated | |
| Notifications & UX Consistency | 0 / 6 | — not yet automated | |
| Sponsors - Request Handling | 0 / 4 | — not yet automated | |
| Authentication - Gap Coverage | 7 / 7 | `tests/core/authentication.spec.ts` | TC-LS-014a, TC-LS-014b, TC-SA-001, TC-SA-N01, TC-LS-009, TC-LS-013, TC-LS-012+TC-LS-004 |
| **Grand total** | **53 / 223** | | |

### Concurrency & Login/Session — last live execution: 2026-08-15

**Authentication (`authentication.spec.ts`): 7/7 passed.** Clean run, no issues.

**Concurrency (`concurrency.spec.ts`): 6/10 passed, 4 failed.** The 4 failures are consistent
with the non-idempotency this file's header docstring already warns about, not new product
bugs: TC-CC-001, TC-CC-008 and TC-CC-003 all timed out waiting for a "Book" button on a
specific timeslot (10:20/10:40/12:20 on the shared Booking Test Event) — those exact slots
were already consumed by the prior 2026-08-13 run and never freed, so the button these tests
look for is no longer there. TC-CR-004 (SLOT 14:20) failed its `bothCrashed` assertion the
same way, most likely for the same underlying reason (fixture state left over from
2026-08-13, not a fresh regression). **Action item before the next run:** pick fresh
unconsumed slots (or reset the Booking Test Event fixture) for these 4 cases so the next
execution gives a clean pass/fail signal instead of a stale-state false negative. Full
per-test detail: `../One2One_Meet_Concurrency_LoginSession_ExecutionResults_2026-08-15.xlsx`.

**Authentication - Gap Coverage is not part of the original 216-case register** — these 7 TC-IDs
were found by live-surfing staging on 2026-08-11 (see `recon/2026-08-11-auth-and-module-sweep/`)
and don't exist in `../../One2One_Meet_TestCases_Merged.xlsx`. Full detail, plus 7 more cases
not yet automated here (TC-LS-002/010/011, TC-SA-003/004/005), lives in the "Login & Session -
Gaps" and "Super Admin - Gaps" sheets of `../../One2One_Meet_TestCases_Concurrency_and_Gaps.xlsx`.

## 2026-08-12 gap sweep (delegate-side dashboard modules)

Also not part of the original 216-case register. Full case detail (steps/data/expected result,
including cases NOT automated here) lives in the new
`../../One2One_Meet_TestCases_NewGaps_2026-08-12.xlsx`. Recon transcripts: `recon/2026-08-12-gap-sweep/`.

| Module | Automated / Authored | Spec file | TC-IDs covered |
|---|---|---|---|
| EO-Delegate Toggle | 3 / 11 | `tests/core/eo-delegate-toggle.spec.ts` | TC-EOT-002, TC-EOT-003, TC-EOT-004 |
| Dashboard Search Bar (organizer) | 3 / 15 | `tests/core/dashboard-search.spec.ts` | TC-SRCH-002, TC-SRCH-006, TC-SRCH-009 |
| Delegate Directory Search | 4 / 6 | `tests/core/delegate-directory-search.spec.ts` | TC-DDIR-001, TC-DDIR-003, TC-DDIR-004, TC-DDIR-005 |
| Delegate Meeting Reports | 3 / 8 | `tests/core/delegate-meetings-report.spec.ts` | TC-DRPT-001, TC-DRPT-002, TC-DRPT-003 |
| Delegate Feedback (Gaps) | 2 / 8 | `tests/core/delegate-feedback.spec.ts` | TC-DFB-001, TC-DFB-007 |
| Delegate Dashboard Search | 0 / 7 | — not yet automated | |
| Delegate Registration Link | 0 / 4 | — **confirmed not applicable**, see below | |
| **2026-08-12 sweep total** | **15 / 59** | | |

Real findings from this pass, not assumptions:
- **Fixed a real bug in the shared suite**: staging now inserts a 5-step Terms-of-Service
  re-acceptance gate (`/auth/terms-of-service`: tos, security_whitepaper, dpa, sla, eula) after
  some logins. This was silently breaking `TC-LS-013` and `TC-LS-012+TC-LS-004` in
  `authentication.spec.ts`. Fixed in `OrganizerNav.login()`/`loginSuperAdmin()` - both now walk
  the gate if present. All 7 authentication tests pass again.
- **Recovered the "lost" Booking Test Event delegate passwords** (`.env`, gitignored) via
  Organizer > Delegates > Resend Link for both `BTE-BDC-alex` and `BTE-BEC-blake`, then read the
  fresh credentials back from Mailpit. `bookingDelegateAPage`/`bookingDelegateBPage` fixtures work again.
- **Dashboard search bar is not decorative** - `GET /api/organizer/search?search_term=...` fires
  live on every keystroke (no Enter needed) and returns relevance-ranked, highlighted, per-table
  grouped results (events/announcements/delegates/...). The dropdown renders correctly; it's a
  plain `<div>` with a "View all results" footer link, not an ARIA `listbox`/`menu`.
- **EO-Delegate Toggle**: first-ever toggle for an event opens a 2-step "Create Delegate Account"
  wizard (Company Information -> Participant Information, both pre-filled from the org's own
  profile); once that delegate profile exists, later toggles switch directly to
  `/delegate/<slug>/dashboard`. Toggling off uses a *different* aria-label
  (`Set delegate inactive`) than toggling on (`Set delegate active`). Organizer-only routes are
  correctly route-guarded while in Delegate mode (redirect back to the delegate dashboard).
- **"Meeting Reports" is not a separate sidebar item** - it's reached via a link on the
  **Meetings** page (`/delegate/<slug>/meeting-report`), and renders one row per meeting
  (partner, date/time, country, duration, venue/table) plus an "Export All Meetings" download,
  not aggregate counts.
- **Delegate directory search requires "Apply Filters"** - typing alone does not live-filter or
  fire any request; you must click Apply Filters. Confirmed both the empty-state ("No delegates
  found") and a working partial-name match through that button.
- **No delegate-side Registration Links feature exists.** The delegate dashboard's full nav is
  exactly: My Profile, Agenda, Meetings, Delegates, Feedbacks. The 4 cases speculatively
  authored for this in `One2One_Meet_TestCases_NewGaps_2026-08-12.xlsx` are marked
  "N/A - feature not present" rather than executed.

**Full-suite health check (2026-08-12, after the above):** all 15 new tests pass, plus the same
13 pre-existing tests that were already green (7 `authentication.spec.ts` + TC-DL-001/N02/N03 +
TC-RP-001 + TC-SC-004 + TC-AG-003) = 28/55 passed. The other **26 pre-existing tests now fail**,
scattered across 13 spec files (access-types, announcements-feedback, delegate-management,
event-management, live-meetings, manual-booking, meeting-booking, registration-links, reports,
sponsor-categories, sponsors, table-configuration, timeslots-agenda) with 13 unrelated root
causes - e.g. Access Types' button is now labelled "Add Access Type" not "Add New";
`DelegatesPage.pickReactSelect`'s Access Type locator now matches 2 elements (strict-mode
violation). This is real UI/copy drift in the app since these were last verified 2026-08-09, not
something a login-flow fix could cause - confirmed by the failures having 13 independent error
shapes instead of one common one. **Not fixed in this pass** (out of scope - it's a
page-object-by-page-object maintenance job, not a quick patch); flagging here so the next person
touching this suite isn't surprised.

## How to extend coverage

1. Pick the next-highest-value TC-ID(s) from `../master-test-register.html` for a module above.
2. Check whether a page object for that module already exists under `tests/support/pages/` —
   most core modules do; extend it rather than duplicating locators in the spec file.
3. Title the test with the real TC-ID exactly as it appears in the register (e.g.
   `test('TC-DM-013 pagination...')`) — the regression-tracking script
   (`scripts/run-tracked.js`) parses TC-IDs out of test titles via regex, so this is how a
   test shows up correctly in `REGRESSION_LOG.md` and `CASE_MAP.md` stays accurate.
4. Update the table above and re-run `npm run test:tracked` to confirm the new case passes
   before committing.

## Cases intentionally not chosen for the smoke tier

The 65 already-proven specs described in `../../KNOWLEDGE.md` (2026-08-09 session) cover far
more than what's automated here — this smoke tier deliberately picked 1–4 highest-value cases
per module (golden path + the validation guard most likely to regress) to keep the suite fast
enough to run on every change. The remaining ~30 already-proven-but-not-yet-reimplemented
cases and the full Concurrency/Danger-Zone/UX-Trace sections (56 cases, require sustained-load
tooling beyond plain Playwright for several of them - see register comments) are the natural
next tier, not a gap in this delivery.
