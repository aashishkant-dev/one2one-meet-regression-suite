# One2One Automation — Comprehensive Regression Suite

End-to-end post-deploy test suite covering booking, meeting-request lifecycle, and event-state access control.
38 curated cases across Auth & Session, Core CRUD, Concurrency, Booking Scheduler, Meeting Requests, and
Event-State Access Control — all safe to run repeatedly (each creates fresh `Date.now()`-suffixed data or
reads only), so this suite never needs manual fixture reset between runs. Runs live against staging, in a
real browser, with real requests.

**Scope:** Core smoke tests (10) + comprehensive booking/meeting workflows (28). Not the full 53+ case
regression suite — this is the validated, production-critical subset.

## Status: 38/38 passing (comprehensive, 2026-08-17)

Latest expansion adds full booking scheduler, meeting-request lifecycle, and event-state access control
(past/current/future event gates). All tests verified against staging.

**Known fixed issues:**
- 2026-08-15 UI-drift: 8 Page Object bugs fixed (renamed buttons, relabeled fields, react-select → radio buttons, locator collisions)
- Booking slot consumption: TC-CC-001/008/003/CR-004 consume specific slots (06 Sep: 10:20, 10:40, 11:00, 12:20); new tests pick fresh times (14:35+)

## What's covered and why

| Module | Tests | Spec File | Coverage |
|---|---|---|---|
| **Auth & Session** | 5 | `tests/auth/login-session.smoke.spec.ts` | Organizer + delegate login, session portability, logout invalidation. Foundation for all features. |
| **Core CRUD** | 3 | `tests/core-crud/event-and-delegate.smoke.spec.ts` | Event/delegate/access-type creation. Golden-path flows most likely to break from UI changes. |
| **Concurrency** | 2 | `tests/concurrency/race-conditions.smoke.spec.ts` | Parallel event + sponsor creation races. Safe, timestamped, re-runnable indefinitely. |
| **Booking Scheduler** | 8 | `tests/booking/booking-scheduler-flow.spec.ts` | Calendar view, slot booking, blocking, request submission, double-booking prevention, email confirmation. Core delegate booking UX. |
| **Meeting Requests** | 10 | `tests/meeting-request/organizer-meeting-management.spec.ts` | Organizer inbox, approve/reject/reschedule, meeting management, notifications. Critical organizer workflows. |
| **Event-State Access** | 10 | `tests/event-state/time-based-access-control.spec.ts` | Future/current/past event gates, booking window enforcement, read-only modes. Ensures time-based access control works. |

**Total: 38 tests**, ~8 mins headless, ~15 mins headed (with browser interaction).

## Setup

```bash
cd one2one-automation
npm install
npx playwright install chromium
cp .env.example .env   # fill in real values - same fixtures as ../regression-suite/.env
```

## Running

```bash
npm test                 # all 38 tests, headless
npm run test:headed      # watch it run in a real browser window
npm run test:ui          # Playwright's interactive UI mode

# Selective runs:
npm run test:auth        # just Auth & Session (5 tests)
npm run test:core-crud   # just Core CRUD (3 tests)
npm run test:concurrency # just Concurrency (2 tests)

# Booking & Meeting workflows:
npx playwright test tests/booking          # Booking Scheduler (8 tests)
npx playwright test tests/meeting-request  # Meeting Requests (10 tests)
npx playwright test tests/event-state      # Event-State Access (10 tests)

# Single test by TC-ID:
npx playwright test -g "TC-BS-001"   # booking scheduler test
npx playwright test -g "TC-MR-002"   # meeting request approval test
npx playwright test -g "TC-EA-001"   # event-state test
```

A failed run leaves a trace/screenshot/video under `test-results/` and a full HTML report —
open it with `npm run report`.

## How this stays in sync with the full suite

The three spec files here import their Page Objects (`EventsPage`, `DelegatesPage`,
`OrganizerNav`, etc.) directly from `../regression-suite/tests/support/pages/` instead of
duplicating them. Every hard-won selector fix or gotcha discovered there (labels changing,
route quirks, react-select scoping) applies here automatically — nothing to keep in sync by
hand. Only the actual test bodies (which cases to run, in which combination) live in this repo.

## CI

`.github/workflows/smoke.yml` (repo root) runs this suite on demand and nightly — see that
file for the schedule and required repo secrets. Trigger a manual run from the GitHub Actions
tab any time you want a fast "is anything obviously broken" answer after deploying a change.
