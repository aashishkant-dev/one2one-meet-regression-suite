# One2One Meet — Regression Suite

Automated Playwright regression suite for One2One Meet, built to replace the `full-test-suite`
/ `regression-suite` project described in `../../KNOWLEDGE.md` that was lost (not committed to
git anywhere, so it disappeared when the working folder was cleaned up). This is the
"lost project" problem being fixed properly this time: this folder is a real git repo from
the start, so history survives even if the working copy doesn't.

33 smoke-tier test cases across the 14 core functional modules, each titled with its real
TC-ID from the 216-case master register (`../master-test-register.html`) so a failure points
straight back to the case's full steps/data/expected-result. See `CASE_MAP.md` for exactly
which TC-IDs are covered and where.

## Status: written, not yet executed

This code was written in a session with no live browser/Playwright tool and no access to the
staging credentials — every selector, route, and gotcha it encodes is transcribed from
`../../KNOWLEDGE.md`'s detailed live-verification notes (2026-08-08 through 2026-08-09
sessions), and it typechecks cleanly + registers all 33 tests under `playwright test --list`.
**It has not been run against the real app.** Treat the first real run as a calibration pass:
some selectors (`getByLabel`, exact button text) are reasonable guesses at markup that wasn't
pinned down byte-for-byte in the notes, and will need a quick fix-up against the live DOM
before they're fully reliable. The parts explicitly confirmed byte-for-byte in KNOWLEDGE.md
(react-select scoping, `aria-checked` over `isChecked()`, the datepicker selector, the
event-switch race, dialog-scoping) are the least likely to need changes.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in real values, see "Fixtures & credentials" below
```

## Running

```bash
npm test                    # headless, all specs
npm run test:headed         # watch it click through in a real browser window
npm run test:ui             # Playwright's interactive UI mode - best for fixing selectors
npx playwright test event-management.spec.ts   # single file
npx playwright test -g "TC-DM-001"              # single case by TC-ID
npm run test:tracked        # full run + appends to REGRESSION_LOG.md (see below)
```

## How regression tracking works (the "track down easily" part)

Every test is titled with its real TC-ID. `npm run test:tracked`:

1. Runs the full suite via `playwright test`, which also writes a JSON report to
   `regression-log/last-run.json` (gitignored - it's raw/verbose, not meant to be read directly).
2. Diffs this run's per-test pass/fail against the last tracked run.
3. Appends a machine-readable entry to `regression-log/history.json` (**committed to git** -
   full history of every tracked run, one JSON array entry each) and a human-readable block
   to the top of `REGRESSION_LOG.md` (**committed to git**) listing:
   - pass/fail/skip counts and the git commit SHA the run was against
   - **NEW FAILURES since last tracked run** — exactly which TC-IDs just broke
   - **Newly passing** — exactly which TC-IDs just got fixed

Practical effect: after you make a change, run `npm run test:tracked`, then
`git diff REGRESSION_LOG.md` shows you precisely what changed, and `git log -p
REGRESSION_LOG.md` gives you the full trend over time — no manual spreadsheet updates, no
re-deriving "wait, was TC-MB-014 passing last week?" from memory.

Run `npm test` (not `test:tracked`) for a quick local check that doesn't want to touch the
tracked history — e.g. while you're still fixing a selector and expect several red runs in a row.

## Fixtures & credentials

All values live in `.env` (gitignored, never commit it) — see `.env.example` for the full
list with comments on where each one comes from. Two categories:

**Known** (already captured in `../../KNOWLEDGE.md`, just needs copying into `.env`):
Super Admin login, QA E2E Organizer login, Current/Past Event slugs.

**Lost** (the original session's `.env` was never committed either, and these specific values
weren't pasted into KNOWLEDGE.md in plaintext): the Booking Test Event delegate passwords
(`O2O_BOOKING_DELEGATE_A_PASSWORD` / `_B_PASSWORD`). To recover or rebuild:

- **Recover**: search Mailpit at `${O2O_MAILPIT_BASE}/api/v1/search?query=Delegate%20account%20has%20been%20created`
  — Mailpit retains all sent credential emails, so if the originals are still there this is a
  direct read, no rebuild needed.
- **Rebuild** (if Mailpit has rotated them out): Organizer > Delegates > Add New (twice, for
  the two participants) on Booking Test Event > select both via "Select all" > **Activate
  All (N)** > confirm the second modal ("Activate N Delegates") — this dispatches fresh
  credentials to Mailpit at each participant's **Contact Email**, not Company Email (bulk
  path targets Contact Email; individual Resend Link targets Company Email — see
  KNOWLEDGE.md "Bonus finding on credential delivery target").

If Booking Test Event itself no longer exists, rebuilding it is a multi-step process
documented in full under "Booking Test Event successfully built" in `../../KNOWLEDGE.md` —
short version: new event > Table Configuration > Table Formation > Mixed Tables (fill Name+
Prefix on Table Type 1 Floating + Table Type 2 Fixed) > Save > Activate Event > add a meeting
agenda (Agenda > day > Add All Day Event > uncheck "All Day" to unlock the Meeting checkbox).

## Project layout

```
tests/
  core/                    # one spec file per module, titled with real TC-IDs
  support/
    env.ts                 # typed .env accessors, throws a clear error if a required var is missing
    utils.ts                # shared gotcha-fixes (datepicker scoping, aria-checked, dialog scoping)
    pages/                  # one Page Object per module, each comment-annotated with the
                             # KNOWLEDGE.md gotcha it encodes
    fixtures/
      test-base.ts           # custom `test` with organizerPage/superAdminPage/bookingDelegate*Page
                             # fixtures that auto-login, so specs don't repeat login boilerplate
      seeded-data.ts          # non-secret reference data about the QA E2E staging fixtures
scripts/
  run-tracked.js            # the regression-tracking runner described above
regression-log/
  history.json               # committed - append-only log of every `test:tracked` run
CASE_MAP.md                  # TC-ID -> spec file map + coverage-by-module table
REGRESSION_LOG.md            # committed, generated - human-readable run history, newest first
```

## Known limitations of this smoke tier

- **Concurrency & Race Conditions (33 cases)** and several **Danger Zone** cases are not
  automated here — genuine concurrent-request testing needs either parallel API calls
  (`Promise.all` against the REST endpoints directly, bypassing UI click latency) or a load
  tool, not plain sequential Playwright clicks. `../../KNOWLEDGE.md` already has the specific
  settings/endpoints each case needs; this is the natural next tier to build, not an oversight.
- **UX Trace (18 cases)** — full-trace assertions across every surface (bell notification,
  Meeting Details, organizer Live Meetings, organizer Delegate Meetings) for a single booking
  event. Not yet automated; `TC-MRL-01` in the register is the best starting point.
- The suite runs `workers: 1` / `fullyParallel: false` on purpose — specs mutate shared
  staging fixtures (delegate status, agendas, sponsor promotions), so parallel runs would race
  each other on the same data. If/when this grows, the fix is per-spec dedicated fixtures, not
  just flipping on parallelism.
