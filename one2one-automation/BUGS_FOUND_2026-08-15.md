# Bugs Found — 2026-08-15 Live Run

First live run of `one2one-automation` surfaced 8 real bugs in the shared Page Objects
(`../regression-suite/tests/support/pages/`) — every one caused by the live app changing
since these selectors/test data were last verified, not by flaky tests. All 8 are fixed.
This file is the detailed version; `../regression-suite/CASE_MAP.md`'s "2026-08-15 UI-drift
fixes" section has the condensed table.

**How to use this file:** whenever you touch Access Types, Delegate creation, or Event
creation in the app, re-run the command listed for that bug — that's the whole verification
step, no manual click-through needed.

```bash
cd one2one-automation
npm test                                    # headless - fast, default for local iteration
npm run test:headed                         # same suite, watch it click through a real browser
npx playwright test -g "<TC-ID>"            # just one case (see commands per bug below)
```

---

## 1. Access Types — "Add New" button renamed

- **File:** `AccessTypesPage.openAddForm()`
- **Symptom:** `getByRole('button', { name: /add new/i })` timed out — button no longer exists.
- **Root cause:** Copy changed to **"Add Access Type"** sometime after 2026-08-12.
- **Fix:** Match both `/^add new$|^add access type$/i`.
- **Verify:** `npx playwright test -g "TC-AT-001"`

## 2. Access Types — Type field is now radio buttons, not a dropdown

- **File:** `AccessTypesPage.selectType()`
- **Symptom:** Timed out looking for a react-select control next to the "Type" label.
- **Root cause:** The Individual/Shared selector was redesigned from a react-select dropdown
  to plain `<input type="radio">` buttons. "Individual" is checked by default.
- **Fix:** `page.getByRole('radio', { name: type }).check()` instead of opening a dropdown.
- **Verify:** `npx playwright test -g "TC-AT-001"`

## 3. Access Types — Save button renamed

- **File:** `AccessTypesPage.saveButton()`
- **Symptom:** `/^save$|^create$/i` (exact-match regex) didn't match the real button text.
- **Root cause:** Copy changed to **"Create Access Type"**.
- **Fix:** Match `/^save$|^create$|^create access type$/i`.
- **Verify:** `npx playwright test -g "TC-AT-001"`

## 4. Access Types — Max Participants field has no real `<label>`

- **File:** `AccessTypesPage.maxParticipantsField()`
- **Symptom:** `getByLabel(/max participants?/i)` found zero elements, even though the field
  is clearly visible on screen with the text "Max Participants \*" right above it.
- **Root cause:** That text is an unassociated sibling `<div>`, not a real `<label for>`. The
  input's only accessible name comes from its placeholder, `"Enter max participants"`.
- **Fix:** `page.getByRole('spinbutton', { name: /max participants/i })` (role/name resolves
  via placeholder when there's no label) instead of `getByLabel`.
- **Verify:** `npx playwright test -g "TC-AT-001"`

## 5. Delegates — Access Type label collides with the Country field

- **File:** `DelegatesPage.pickReactSelect()`
- **Symptom:** `Error: strict mode violation ... resolved to 2 elements` — one match for
  "Select access type", one for "Select Country".
- **Root cause:** The unscoped `getByText(/access type/i)` locator (missing `.first()`, unlike
  the equivalent method in `EventsPage`) also matches inside the Country field's markup.
  This was already flagged in the 2026-08-12 gap sweep notes and never fixed until now.
- **Fix:** Add `.first()`.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 6. Delegates — react-select option click collides with a native phone `<select>`

- **File:** `DelegatesPage.pickReactSelect()` (the option-click half)
- **Symptom:** `Error: strict mode violation ... resolved to 3 elements` — one real
  `react-select__option`, plus **two** native `<option value="NP">Nepal</option>` elements
  from the page's phone-country-code widgets (always in the DOM regardless of open state).
- **Root cause:** `getByRole('option', { name: optionText, exact: true })` searches the whole
  page, not just the open react-select listbox.
- **Fix:** Scope to the CSS class instead: `page.locator('.react-select__option', { hasText:
  optionText }).first()` — mirrors the pattern `EventsPage`'s private `pickReactSelect`
  already used correctly.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 7. Delegates — Country/City labels went plural

- **File:** `DelegatesPage.createDelegate()`
- **Symptom:** `getByText(/^country/i)` / `/^city/i` timed out.
- **Root cause:** Labels changed to **"Countries \*"** / **"Cities"** sometime after
  2026-08-12 — `/^country/i` doesn't match a string starting "Countr**i**es" (diverges at the
  7th character).
- **Fix:** `/^countr(y|ies)/i` and `/^cit(y|ies)/i`.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 8. Delegates — Salutation is now a plain text field

- **File:** `DelegatesPage.createDelegate()`
- **Symptom:** Timed out looking for a react-select control next to "Salutation".
- **Root cause:** Redesigned from a react-select to a plain text input, placeholder
  `"Mr./Mrs./Ms./Dr."`. No real `<label>` either.
- **Fix:** `page.getByPlaceholder(/mr\.\/mrs\.\/ms\.\/dr\./i).fill(...)`.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 9. Delegates — First/Last Name and Contact Email have no real `<label>`s

- **File:** `DelegatesPage.createDelegate()`
- **Symptom:** `getByLabel(/first name/i)` timed out despite the field being visible.
- **Root cause:** Same pattern as bug #4 — the whole "Participant Information" section uses
  unassociated label text; accessible names come from placeholders only.
- **Fix:** `getByPlaceholder(/enter first name/i)`, `/enter last name/i`,
  `/enter contact email/i`.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 10. Delegates — both Contact Number fields need the phone-widget treatment

- **File:** `DelegatesPage.createDelegate()`
- **Symptom:** Phone field showed 🇮🇷 **+98 00000000** ("Invalid phone number") instead of
  Nepal — a plain `.fill('9800000000')` got misread by the widget's auto-country-detect logic.
- **Root cause:** Same auto-detect phone widget as `EventsPage`'s Event Contact Number
  (documented there since 2026-08-13) — needs real keystrokes and a leading `+<countrycode>`,
  which `DelegatesPage` never applied. Both the company and participant Contact Number fields
  share the placeholder `"Enter contact number"` (`.first()` / `.last()`).
- **Fix:** New `DelegatesPage.fillPhoneNumber()` helper (click → clear → `pressSequentially`
  with a leading `+977`), matching `EventsPage.createEvent()`'s existing pattern. Test data
  updated from `'9800000000'` to `'+9779800000000'` in every caller.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 11. Delegates — Create button renamed

- **File:** `DelegatesPage.createDelegate()`
- **Symptom:** `/^save$|^create$/i` didn't match.
- **Root cause:** Copy changed to **"Create Delegate"**.
- **Fix:** Match `/^save$|^create$|^create delegate$/i`.
- **Verify:** `npx playwright test -g "TC-DM-001"`

## 12. Events — createEvent() didn't dismiss the new post-submit modal

- **File:** `EventsPage.createEvent()`
- **Symptom:** After submitting, `searchByName()` timed out waiting for the Events-list search
  box — the page was still showing the Add New Event form.
- **Root cause:** A successful create now pops an **"Event created successfully"** modal with
  a "Later" button on top of everything else. `concurrency.spec.ts`'s `TC-CE-001` had its own
  inline copy of the wait-and-dismiss logic; every other caller (including plain `TC-EV-001`)
  had no way to know about it.
- **Fix:** Centralized into a new private `EventsPage.dismissPostCreateModalIfPresent()`,
  called at the end of `createEvent()` itself. Removed the now-redundant inline copy from
  `concurrency.spec.ts`.
- **Verify:** `npx playwright test -g "TC-EV-001"`

## 13. Delegate login — wrong-password error copy changed

- **File:** `DelegateAuthPage.expectInvalidLoginError()`
- **Symptom:** `getByText(/invalid login|not found/i)` never appeared, even though a real
  error toast (**"Invalid credentials"**) was visible on screen for the full 10s the assertion
  polled — confirmed by live probing, so not a timing/toast-fade issue.
- **Root cause:** Error copy changed sometime after 2026-08-13; the regex simply didn't cover
  the new wording.
- **Fix:** Match `/invalid login|not found|invalid credentials/i`.
- **Verify:** `npx playwright test -g "TC-DL-N01"`

---

## Also fixed: stale test data with the same root causes

Not new Page-Object bugs, but the same underlying drift caught in caller test data too:

| File | What was wrong | Fix |
|---|---|---|
| `regression-suite/tests/core/delegate-management.spec.ts` | `accessType: 'Individual'` — seeded option is actually `'Individual Access'` | Updated literal |
| `regression-suite/tests/core/event-management.spec.ts` | Missing `timezone`/`country` (required since the 2026-08-13 form redesign); `contactNumber` missing `+977` prefix | Added fields, fixed prefix |
| `one2one-automation/tests/core-crud/event-and-delegate.smoke.spec.ts` | Same two issues, copied from the same stale examples | Same fixes |

## Environmental noise observed (not bugs)

~15 consecutive full runs against staging in one debugging session produced a handful of
`net::ERR_NETWORK_CHANGED` / `net::ERR_INTERNET_DISCONNECTED` failures and one stray failed
login — confirmed local sandbox network instability from that sustained pace (every affected
test passed cleanly on a clean-network re-run). Not expected under normal single-run local
usage or in GitHub Actions.
