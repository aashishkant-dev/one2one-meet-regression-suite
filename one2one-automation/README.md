# One2One Automation — Post-Deploy Smoke Suite

The essential checks to run after any change to One2One Meet, so you don't have to manually
re-test everything by hand. 13 curated cases across Auth & Session, Core CRUD, and
Concurrency — all safe to run repeatedly (each one either reads only, or creates its own
fresh `Date.now()`-suffixed data), so this suite never needs a manual fixture reset between
runs. Runs live against staging, in a real browser, with real requests.

This is deliberately a **small, fast, trustworthy subset** — not the full regression suite.
For the complete 53+ case suite (including the booking-slot concurrency races that need fresh
timeslots picked before each run), see `../regression-suite`.

## Status: 13/13 passing (verified live, 2026-08-15)

First live run surfaced 8 real UI-drift bugs (renamed buttons, relabeled fields, a react-select
turned into plain radio buttons, an unscoped locator colliding with an unrelated widget) - all
fixed in the shared Page Objects; full list and root cause per case in
`../regression-suite/CASE_MAP.md`'s "2026-08-15 UI-drift fixes" section. That's this suite
doing exactly its job: catching real drift before a human has to find it by hand.

## What's covered and why

| File | Cases | Why these |
|---|---|---|
| `tests/auth/login-session.smoke.spec.ts` | TC-LS-014a/b, TC-SA-001, TC-SA-N01, TC-LS-012+004, TC-DL-001, TC-DL-N01, TC-DL-N02 | Access control and session integrity break silently and affect every other feature — these catch it first. |
| `tests/core-crud/event-and-delegate.smoke.spec.ts` | TC-EV-001, TC-DM-001, TC-AT-001 | The golden-path create flows most likely to break from a UI/copy change (this suite's sister project caught exactly that kind of drift on 2026-08-12). |
| `tests/concurrency/race-conditions.smoke.spec.ts` | TC-CE-001, TC-CE-008 | Real parallel-request races (two independent browser sessions, `Promise.allSettled`), using timestamped names so they're safe to re-run indefinitely — unlike the booking-slot races, which need fresh slots each time. |

**Intentionally excluded** (by design, not oversight): the booking-slot concurrency races
(TC-CC-001/003/008, TC-CR-001/002/004) and anything that mutates a shared, non-timestamped
fixture. Those need manual slot/state prep before each run — see
`../regression-suite/tests/core/concurrency.spec.ts` and its `CASE_MAP.md`.

## Setup

```bash
cd one2one-automation
npm install
npx playwright install chromium
cp .env.example .env   # fill in real values - same fixtures as ../regression-suite/.env
```

## Running

```bash
npm test                 # everything, headless
npm run test:headed      # watch it run in a real browser window
npm run test:ui          # Playwright's interactive UI mode
npm run test:auth        # just Auth & Session
npm run test:core-crud   # just Core CRUD
npm run test:concurrency # just Concurrency
npx playwright test -g "TC-DL-001"   # a single case by TC-ID
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
