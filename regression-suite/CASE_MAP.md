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
| **Core Functional total** | **33 / 160** | | |
| Concurrency & Race Conditions | 0 / 33 | — not yet automated | |
| Settings - Account Danger Zone | 0 / 5 | — not yet automated | |
| Meeting Request Lifecycle | 0 / 8 | — not yet automated | |
| Notifications & UX Consistency | 0 / 6 | — not yet automated | |
| Sponsors - Request Handling | 0 / 4 | — not yet automated | |
| **Grand total** | **33 / 216** | | |

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
