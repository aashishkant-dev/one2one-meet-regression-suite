# One2One Meet — QA

Two Playwright projects, one shared install (npm workspaces), testing the same live staging
app (`one2one.techarttrekkies.com.np`) at two different tiers.

```
one2one/
├── docs/                    # reference material - open these, don't edit them from code
│   ├── master-test-register.html                                    (216-case searchable register)
│   ├── One2One_Meet_TestCases_Merged 8-13-2026.xlsx                 (source workbook for the register)
│   ├── One2One_Manual_Test_Guide_2026-08-14.md                      (steps for the not-yet-automated cases)
│   └── One2One_Meet_Concurrency_LoginSession_ExecutionResults_2026-08-15.xlsx  (latest live-run results)
├── regression-suite/        # the full suite - 53+ TC-IDs across 22 spec files
└── one2one-automation/      # curated 13-case post-deploy smoke suite + GitHub Actions
```

## Which one do I run?

| Situation | Use |
|---|---|
| Just deployed a change, want a fast "did I break anything obvious" check | `one2one-automation` — `npm test`, ~2 minutes, safe to re-run anytime |
| Investigating a specific module, or need the full 53-case pass | `regression-suite` |
| Need the original manual steps/expected-result for a TC-ID | `docs/master-test-register.html` — search box has every TC-ID |
| Want CI to check it for you | `.github/workflows/smoke.yml` — trigger manually from the Actions tab, or let it run nightly |

Each subfolder has its own README with full setup/running instructions. `one2one-automation`'s
also has `BUGS_FOUND_2026-08-15.md` — real UI-drift bugs its first live run caught, with the
exact command to re-verify each one.

## Setup (once, from repo root)

```bash
npm install                       # shared install for both projects
npx playwright install chromium
```

Then `cp .env.example .env` in whichever project you're running and fill in staging
credentials (same fixtures, both projects — copy values straight across).

## Why two projects instead of one

`regression-suite` is comprehensive but slow and stateful (some specs mutate shared
fixtures, so it's not safe to spam-run). `one2one-automation` is a small, hand-picked subset
of it — every case either read-only or self-contained with fresh `Date.now()`-suffixed data —
built specifically to answer "is anything obviously broken" in under 2 minutes without
manual clicking, and safe to run as often as you want, including unattended in CI.
`one2one-automation` imports its Page Objects directly from `regression-suite/tests/support/`,
so a selector fix in one place fixes both.
