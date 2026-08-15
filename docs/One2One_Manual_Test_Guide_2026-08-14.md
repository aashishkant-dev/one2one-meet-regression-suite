# One2One Meet — Remaining Manual Test Cases

**118 test cases** still "Not Tested" in the merged register as of 2026-08-13. Organized by module, most important (Critical/High) first in each one.

**How to use this:** do the steps, see what really happens, write it down, then copy your result back into `One2One_Meet_TestCases_Merged 8-13-2026.xlsx` in the matching row (Actual Result + Status columns). If something doesn't match "Expected result" — that's a finding, write down what it actually did instead. That's just as useful as a Pass.

## Modules

- [Event Mgmt](#event-mgmt) (3 cases)
- [Sponsors](#sponsors) (4 cases)
- [EO-Delegate Reports](#eo-delegate-reports) (4 cases)
- [Settings](#settings) (6 cases)
- [Global Dashboard Search Bar](#global-dashboard-search-bar) (20 cases)
- [UX & Usability](#ux--usability) (10 cases)
- [Login & Session](#login--session) (9 cases)
- [Super Admin](#super-admin) (3 cases)
- [Concurrency - Race Conditions](#concurrency---race-conditions) (21 cases)
- [EO-Delegate Profile](#eo-delegate-profile) (4 cases)
- [Timeslots & Agenda](#timeslots--agenda) (18 cases)
- [Registration Links](#registration-links) (4 cases)
- [Notif-Annc-Feedback](#notif-annc-feedback) (12 cases)

---

## Event Mgmt

### TC-EV-035 — High priority

**What it's testing:** Post-Event Delegate Access Window actually expiring and cutting off access, not just being configurable.

**Steps:**

1. Configure Post-Event Delegate Access Window = 1 day.
2. Let the event end, then let the 1-day window elapse (or use a staging time-shortcut).
3. Attempt delegate login/access to the event after the window has closed.

**Test data:** Access window = 1 day; access attempted after expiry.

**Expected result:** Delegate access is correctly restricted (blocked, or downgraded to a defined read-only state - whichever is the intended design) once the window closes, with a clear message explaining why, rather than delegates retaining indefinite access or being hit with a confusing generic error.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-EV-041 — High priority

**What it's testing:** Automatic Ongoing -> Completed status transition occurring at the exact boundary moment while a delegate is actively mid-booking a meeting.

**Steps:**

1. Time a delegate's 'Send Request' submission to land as close as possible to the event's configured end date/time, when the scheduler is expected to flip status to Completed (per TC-EV-032 in the suite, noting that scheduler is currently flagged Fail there).
2. Observe the outcome of the in-flight booking relative to the transition.

**Test data:** Booking submitted at the exact event-end boundary.

**Expected result:** The in-flight booking either completes cleanly (if the server accepted it just before the transition) or is rejected with a clear 'this event has ended' message - it must never be left in an ambiguous or partially-created state. Note: since TC-EV-032 already found the completion scheduler unreliable, this test should be re-run once that underlying bug is fixed, and will likely surface further issues while it remains broken.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-EV-042 — Medium priority

**What it's testing:** Daylight Saving Time (DST) transition occurring during a multi-day event's date range.

**Steps:**

1. Create a multi-day event whose date range spans a known DST transition date for the venue's timezone.
2. Create agenda slots on days before and after the transition.
3. Verify displayed slot times, booking behaviour, and any duration/gap math across the transition day itself.

**Test data:** Event dates spanning a DST transition; agenda slots before/on/after the transition day.

**Expected result:** Slot times remain correct and unambiguous across the transition - a slot shown as '10:00' continues to represent the intended real-world time correctly, meeting durations/gaps are not silently off by an hour on the transition day itself, and Live Meetings/Reports timestamps stay consistent with what delegates see on their own Agenda.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Sponsors

### TC-SB-001 — High priority

**What it's testing:** A fixed-table sponsor with exactly one table cannot have two concurrent meetings in the same slot, approached through two different entry points (Agenda page 'Add Meeting' vs. Delegates directory 'Request Meeting' button), tested as a baseline single-attempt functional check (not a race - one booking completes fully before the second is attempted).

**Steps:**

1. Book a delegate into sponsor S1's one table/slot via the Agenda page.
2. Attempt to book a different delegate into the same S1 table/slot via the Delegates directory's Request Meeting entry point.
3. Verify the 2nd attempt is blocked before submission (slot shown unavailable) and, if forced via direct action, at submission.

**Test data:** Sponsor S1 with 1 table; 2 delegates; 2 different UI entry points.

**Expected result:** Regardless of entry point, the already-booked table+slot is shown as unavailable/not offered, and any attempt to force a second booking into it is rejected with a clear conflict message. Both entry points must share the same underlying availability truth.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SB-002 — Medium priority

**What it's testing:** Sponsor category with MULTIPLE tables of the same type (e.g. 2 Diamond tables) correctly offers the 2nd table when the 1st is taken for a given slot.

**Steps:**

1. Configure a sponsor category with 2 tables of the same fixed type.
2. Book table 1 for a given slot.
3. Attempt to book a different delegate with a sponsor of that category for the SAME slot.

**Test data:** 2 tables of the same category; same slot requested twice.

**Expected result:** The system correctly offers/uses the 2nd table for the same slot rather than incorrectly reporting the whole category as fully booked. Live Meetings distinguishes the two tables clearly (e.g. DIAM 1 vs DIAM 2) with independent status.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SB-003 — Medium priority

**What it's testing:** Sponsor is deleted (per TC-SP-008 in the merged suite) while they have PENDING (not yet accepted) meeting requests against them.

**Steps:**

1. Create a pending request from a delegate to sponsor S1.
2. Delete S1 as a sponsor (delegate remains, per TC-SP-008).
3. Check the pending request's status and the original requester's view.

**Test data:** One pending request to S1; S1 then deleted as a sponsor.

**Expected result:** The pending request is auto-resolved (rejected/cancelled) with a clear, specific reason shown to the requester (e.g. 'This sponsor is no longer participating in the event'), rather than left permanently pending with no explanation, and rather than silently vanishing without any notification.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SB-004 — Low priority

**What it's testing:** Sponsor's own auto-accept setting interacting correctly with a high volume of independent requests across many different slots on the same day.

**Steps:**

1. Set sponsor S1's personal autoAccept = ON.
2. Have 15-20 different delegates each request a DIFFERENT open slot with S1 across the same day.
3. Let all 24h timers elapse (or use a staging shortcut) and verify every one auto-accepts independently and correctly.

**Test data:** 15-20 independent requests to S1, different slots, same auto-accept window.

**Expected result:** All requests auto-accept correctly at their own respective 24h marks with no cross-interference between the independent timers (no request accidentally confirms the wrong slot, gets skipped because another request's timer fired first, or duplicates a notification meant for a different slot).

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## EO-Delegate Reports

### TC-DRPT-005 — Medium priority

**What it's testing:** Report can be filtered by date range within the event dates

**Steps:**

1. Apply a custom date range filter on the Meetings Report

**Test data:** Range covering half the event

**Expected result:** Report totals recalculate to reflect only meetings scheduled within the selected range

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DRPT-008 — Medium priority

**What it's testing:** Exporting an empty report does not error out

**Steps:**

1. As a delegate with zero meetings, click Export on the Meetings Report

**Test data:** N/A

**Expected result:** A valid (empty/zero-value) export file is produced without a server error or broken download

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DRPT-004 — Low priority

**What it's testing:** Report shows a zero-state for a delegate with no meetings yet

**Steps:**

1. Log in as a newly registered delegate with zero meeting activity
2. Open Meetings Report

**Test data:** New delegate, 0 meetings

**Expected result:** Report renders with all counts at zero and an appropriate 'no activity yet' message, not an error

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DRPT-006 — Low priority

**What it's testing:** Report reflects an immediate update after a meeting is cancelled

**Steps:**

1. Cancel an upcoming meeting
2. Reopen/refresh the Meetings Report

**Test data:** N/A

**Expected result:** Cancelled count increments and the relevant status count decrements accordingly, with no stale/cached totals

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Settings

### TC-SG-001 — High priority

**What it's testing:** Booking window (bookingStart / bookingClose, days-before-event) is validated directly on the Settings form, not only observed downstream.

**Steps:**

1. Settings > Meeting Settings.
2. Enter boundary values: bookingClose = bookingStart (equal), bookingClose further from the event than bookingStart (invalid per TC-MB-N09), bookingStart = 0, bookingStart larger than the whole event lead time.
3. Save each and observe the Settings-page validation message directly.

**Test data:** Boundary values for bookingStart/bookingClose.

**Expected result:** Each invalid combination is rejected with a clear, field-level validation message at the point of saving in Settings - the same rule already proven to hold downstream in TC-MB-N09 must also be enforced (and be visibly explained) right where the organizer configures it, not just discovered later when delegates can't book.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SG-002 — High priority

**What it's testing:** 'Accept/Reject requests automatically after N hours' field boundary testing directly on the Settings form.

**Steps:**

1. Settings > Meeting Settings > auto-accept timeout field.
2. Enter 0, then a negative number, then a non-integer, then a very large number (e.g. 999999).
3. Save each and observe validation.

**Test data:** 0 / negative / non-integer / very large hour values.

**Expected result:** 0 and negative values are rejected with a clear message at the Settings form (matching TC-MB-N07's downstream finding, now verified at the source). A sane upper bound exists and is enforced (e.g. rejecting or capping an unreasonably large value) so the timer can't be configured to effectively never fire.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SG-005 — High priority

**What it's testing:** Auto Rejection and Auto Acceptance are mutually exclusive - verify the backend enforces this, not only the Settings UI.

**Steps:**

1. Attempt to enable both Auto Rejection and Auto Acceptance via the UI (should self-correct per TC-MB-N08).
2. If API/backend access is available, attempt to set both flags true via a direct API call, bypassing the UI's mutual-exclusion guard.
3. Observe which setting the backend honours, and whether an incoming request is ever both auto-accepted and auto-rejected.

**Test data:** Direct API attempt to set both flags true simultaneously.

**Expected result:** The backend independently enforces mutual exclusion (rejects the invalid combination, or deterministically prioritises one) rather than relying solely on the UI to prevent it - a defense-in-depth check, since UI-only validation can be bypassed. An incoming request is never processed as both accepted and rejected.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SG-003 — Medium priority

**What it's testing:** 'Requests from sponsors are auto-accepted' toggled OFF actually changes real request behaviour.

**Steps:**

1. Settings > set autoAcceptIfRequestedBySponsers = OFF.
2. A sponsor delegate sends a meeting request to a regular delegate.
3. Observe whether the request now sits PENDING instead of auto-accepting.

**Test data:** Sponsor -> delegate request; setting OFF.

**Expected result:** With the setting OFF, the sponsor's request behaves like any normal request - it sits PENDING until manually accepted (or the recipient's own 24h auto-accept fires, if separately ON). It must NOT still auto-accept just because the requester is a sponsor.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SG-004 — Medium priority

**What it's testing:** 'Allow multiple meeting requests' toggled ON while a delegate is actively blocked from sending a 2nd request.

**Steps:**

1. With multipleMeetingRequest = OFF, have Delegate A send a request to B, then attempt a 2nd request to B (blocked, per TC-MB-N06).
2. Without A reloading their page, organizer toggles the setting ON and saves.
3. A retries the 2nd request from the still-open page.

**Test data:** Setting flipped OFF->ON mid-session for a delegate who was just blocked.

**Expected result:** A's existing single pending request is unaffected by the toggle. A is able to send the 2nd request successfully once the setting is ON, ideally without needing to reload their page (real-time settings propagation) - or, if a reload is required, that requirement is made clear rather than the button silently staying disabled with no explanation.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SG-006 — Medium priority

**What it's testing:** meetingCancelBeforeEventHour boundary values directly on the Settings form.

**Steps:**

1. Settings > cancel-before-event-hour field.
2. Enter 0 (cancel allowed right up to event start), a negative value, and a value larger than the gap between bookingClose and the event start time.
3. Save each and observe validation/behaviour.

**Test data:** 0 / negative / larger-than-available-window values.

**Expected result:** 0 is either explicitly allowed (meaning cancellation is permitted up to the literal start time) or explicitly rejected with a clear reason - document which is intended. Negative values are rejected. A value larger than the actual available window (e.g. requiring cancellation 10 days before an event that opens booking only 5 days before) is flagged as a logically impossible configuration rather than silently accepted and only discovered later when no delegate is ever able to cancel.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Global Dashboard Search Bar

### TC-SRCH-001 — High priority

**What it's testing:** Global dashboard search bar is visible and reachable from every organizer page

**Steps:**

1. Log in as Organizer
2. Navigate to Dashboard, then to any other module page (Delegates, Sponsors, Settings)

**Test data:** N/A

**Expected result:** Search bar remains visible/accessible in the header on every page, not only the Dashboard landing page

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-004 — High priority

**What it's testing:** Clicking a search result navigates directly to that record's detail page

**Steps:**

1. Search for a known delegate
2. Click their entry in the results dropdown

**Test data:** N/A

**Expected result:** User is taken directly to that delegate's profile/detail page, not just the filtered list

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-015 — High priority

**What it's testing:** A delegate (non-organizer) cannot use the dashboard search to reach data outside their own event

**Steps:**

1. Log in as a Delegate
2. Attempt to use the dashboard/global search, if exposed, to look up a record from a different event

**Test data:** Delegate account, 2 events exist

**Expected result:** Search either is not exposed to delegate role at all, or returns zero results for out-of-scope records

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-001 — High priority

**What it's testing:** Delegate dashboard search bar locates another delegate by name

**Steps:**

1. Log in as Delegate
2. Open the dashboard search bar
3. Type a fellow delegate's name

**Test data:** Existing co-delegate name

**Expected result:** Matching delegate(s) from the same event are returned in the results list

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-005 — High priority

**What it's testing:** Selecting a delegate from search opens their profile with a meeting-request action

**Steps:**

1. Search for a delegate
2. Click their result

**Test data:** N/A

**Expected result:** Delegate's profile view opens showing enough info to decide, with a visible 'Request Meeting' action if a slot is available

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-005 — Medium priority

**What it's testing:** Search is case-insensitive and matches partial strings

**Steps:**

1. Search using lowercase and partial spelling of an existing delegate's name

**Test data:** e.g. 'nil kha' for 'Nil Khanta'

**Expected result:** Matching record(s) are still returned despite case and partial match

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-008 — Medium priority

**What it's testing:** Search below the minimum character threshold does not fire a query

**Steps:**

1. Type a single character into the search bar

**Test data:** e.g. 'a'

**Expected result:** No API call/results dropdown fires, or a hint like 'Type at least N characters' is shown instead of a full search

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-010 — Medium priority

**What it's testing:** Search input containing SQL special characters does not break the query

**Steps:**

1. Enter SQL meta-characters into the search bar

**Test data:** ' OR '1'='1  /  --

**Expected result:** Search returns a normal empty/valid result set; no server error and no unintended data exposure

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-011 — Medium priority

**What it's testing:** Search results are scoped to the currently active event

**Steps:**

1. Switch active event via the top event dropdown
2. Search for a delegate that belongs only to the previous event

**Test data:** 2 events, distinct delegate lists

**Expected result:** No match is returned for the delegate outside the currently selected event's scope

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-013 — Medium priority

**What it's testing:** Search debounces requests while typing quickly

**Steps:**

1. Type a full name quickly, letter by letter, without pausing

**Test data:** N/A

**Expected result:** Only the final query is executed (or requests are debounced); results do not flicker through every intermediate keystroke's results

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-002 — Medium priority

**What it's testing:** Delegate dashboard search locates a sponsor by company name

**Steps:**

1. As Delegate, search using a sponsor's company name

**Test data:** Existing sponsor company name

**Expected result:** The matching sponsor entry is returned in results, if sponsors are part of dashboard search scope

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-003 — Medium priority

**What it's testing:** Searching for the delegate's own name is handled sensibly

**Steps:**

1. As Delegate, search for your own name

**Test data:** Logged-in delegate's own name

**Expected result:** Own record is excluded from bookable results, or is clearly marked as 'You' so it is not mistaken for another delegate

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-004 — Medium priority

**What it's testing:** Search does not return a deactivated delegate

**Steps:**

1. Organizer deactivates a delegate
2. As a different Delegate, search for that deactivated delegate's name

**Test data:** One delegate set to Inactive

**Expected result:** Deactivated delegate does not appear in search results (or appears clearly marked inactive, not bookable)

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-007 — Medium priority

**What it's testing:** Search with only special characters returns an empty state gracefully

**Steps:**

1. Enter only symbols into the search bar

**Test data:** '###???'

**Expected result:** An empty/no-results state is shown; no error or crash occurs

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDIR-002 — Medium priority

**What it's testing:** Directory search also matches by company/organization name

**Steps:**

1. Search using a delegate's company/organization name instead of personal name

**Test data:** Existing company name

**Expected result:** Delegate(s) belonging to that company are returned

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-007 — Low priority

**What it's testing:** Clearing the search box resets the results dropdown

**Steps:**

1. Perform a search that returns results
2. Click the clear/x icon or delete all text

**Test data:** N/A

**Expected result:** Results dropdown closes/resets; search bar returns to its default empty state

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-012 — Low priority

**What it's testing:** Search box supports keyboard-only navigation

**Steps:**

1. Type a query that returns multiple results
2. Use Down/Up arrow keys to move through results
3. Press Enter on a highlighted result

**Test data:** N/A

**Expected result:** Arrow keys move the highlighted selection; Enter opens the highlighted result, all without using the mouse

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SRCH-014 — Low priority

**What it's testing:** Search bar remains usable on a mobile-width viewport

**Steps:**

1. Resize browser / use device emulation to a mobile width (e.g. 375px)
2. Open and use the search bar

**Test data:** Viewport: 375x812

**Expected result:** Search bar is reachable (e.g. via icon) and results are fully readable without overlapping other header elements

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDS-006 — Low priority

**What it's testing:** Search input trims leading/trailing whitespace

**Steps:**

1. Search with extra spaces before/after a valid name

**Test data:** '  Nil Khanta  '

**Expected result:** Whitespace is trimmed and the correct match is still returned

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DDIR-006 — Low priority

**What it's testing:** Directory search combines correctly with an existing filter (AND logic)

**Steps:**

1. Apply an Access Type filter
2. Additionally type a name into the search bar

**Test data:** Access Type filter + name query

**Expected result:** Results satisfy both the filter and the search text simultaneously (intersection, not either/or)

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## UX & Usability

### TC-UX-003 — High priority

**What it's testing:** Cancelling a meeting, rejecting a request, and deleting a delegate/sponsor/category each require a clear confirmation step that states the real consequence.

**Steps:**

1. Trigger Cancel Meeting, Reject Request, and Delete (delegate/sponsor/category) actions one at a time.
2. Read the confirmation dialog text for each.

**Test data:** One instance of each destructive action.

**Expected result:** Every destructive action shows a confirmation step before executing, and the wording is specific to the real consequence (e.g. cancelling a sponsor meeting should remind the user this can't be easily undone per the 'meetings with sponsors cannot be re-booked once cancelled' style rule already documented in Meeting Booking's Good-to-know notes) rather than a generic 'Are you sure?' that doesn't convey what's actually at stake.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-004 — High priority

**What it's testing:** Send Request / Accept / Reject buttons give immediate visual feedback (disabled + loading state) the instant they're clicked, before the server responds.

**Steps:**

1. Throttle network to add visible latency.
2. Click Send Request, then Accept, then Reject on separate test items.
3. Observe button state during the round-trip, and behaviour if the server call fails (e.g. simulate offline mid-click).

**Test data:** Throttled/interrupted network during each action.

**Expected result:** Each button visibly disables/shows a loading indicator immediately on click, preventing a double-click double-submit (this is also the primary UI-layer defence for TC-CR-001's idempotency case). If the server call fails, the button reverts to its actionable state with a clear error/retry message - it must never be left stuck in a permanent loading state.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-005 — High priority

**What it's testing:** Error messages across the booking flow are specific and actionable, not generic 'Something went wrong' text.

**Steps:**

Deliberately trigger a range of failure conditions (booking window closed, slot just taken, validation failure, network drop mid-submit) and read the exact message shown each time.

**Test data:** Multiple distinct failure conditions.

**Expected result:** Every error message names the specific problem and, where applicable, the next step (e.g. 'This slot is no longer available - pick another' rather than 'Error 409' or 'Something went wrong'). This is the general UX principle underlying every 'LOSER' message specified across the Concurrency sheets in this workbook - it should hold everywhere in the app, not only in the race-condition cases.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-001 — Medium priority

**What it's testing:** Agenda/slot grid shows a proper loading (skeleton/spinner) state while fetching, with no blank flash or layout jump once data arrives.

**Steps:**

1. Throttle network (DevTools > Network > Slow 3G) and open Agenda.
2. Observe the page between navigation and data arrival.
3. Repeat for Live Meetings and the Delegates directory.

**Test data:** Throttled network (e.g. Slow 3G / 500ms+ latency).

**Expected result:** A clear loading indicator (skeleton or spinner) is shown while data loads - never a blank/broken-looking page, and never a layout jump (content shifting position) once the real data replaces the loading state. This matters most on event day when delegates are on venue Wi-Fi with variable latency.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-002 — Medium priority

**What it's testing:** A delegate with zero remaining open slots (fully booked) sees a clear, encouraging empty state - not just a blank grid.

**Steps:**

1. Book/block every available slot for a test delegate.
2. View that delegate's Agenda / slot picker.

**Test data:** Delegate with 0 open slots remaining.

**Expected result:** A clear message explains the state (e.g. 'You have no open slots left for this event' rather than a silently empty grid that looks like a loading failure), ideally with a next step (e.g. a link to view their existing Scheduled meetings, or contact the organizer for more slots).

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-006 — Medium priority

**What it's testing:** Agenda slot grid, Live Meetings table, and the Delegates directory remain usable on a small (mobile) screen width.

**Steps:**

1. Open Agenda, Live Meetings, and Delegates directory at a mobile viewport width (e.g. 375px, or an actual phone).
2. Attempt to book a meeting and read a Live Meetings table row end-to-end.

**Test data:** Mobile viewport (~375-414px wide).

**Expected result:** Layouts adapt sensibly (stacking, horizontal scroll with a clear affordance, or a mobile-specific view) rather than a desktop-width table being squeezed illegibly - delegates realistically use their phones at a live event, and organizers may check Live Meetings on the move.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-007 — Medium priority

**What it's testing:** When a delegate's chosen slot/target is unavailable, the system proactively suggests the next best alternative rather than just saying no.

**Steps:**

1. Attempt to book a delegate/sponsor slot that is unavailable (e.g. per TC-CC-001's LOSER path).
2. Observe whether the rejection screen offers alternative open slots directly, or requires the user to manually re-browse from scratch.

**Test data:** One deliberately-unavailable target slot.

**Expected result:** Ideally, the rejection surfaces the target's next 1-3 open slots directly in the same dialog/toast so the delegate can act in one click, rather than being dumped back to a full re-search - this materially reduces frustration during a high-demand moment like a popular sponsor's booking window opening.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-009 — Medium priority

**What it's testing:** Status is never communicated by colour alone (Pending/orange, Scheduled/green, Blocked/grey, etc.), and core actions are keyboard-reachable.

**Steps:**

1. View the Agenda slot grid and Live Meetings table with a colour-blindness simulation filter (e.g. browser DevTools rendering emulation) or in greyscale.
2. Tab through Send Request / Accept / Reject controls using only the keyboard.

**Test data:** Greyscale/colour-blind rendering; keyboard-only navigation.

**Expected result:** Every status remains distinguishable without colour (via text label, icon, or pattern), and every primary action (Send/Accept/Reject/Cancel/Block) is reachable and operable via keyboard alone with a visible focus indicator - baseline accessibility for a tool used under time pressure by a wide range of delegates.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-008 — Low priority

**What it's testing:** The notification bell visually distinguishes meeting-request items from announcements and system notices, not just a single undifferentiated list.

**Steps:**

1. Generate one of each notification type (meeting request, announcement, event-activated system notice).
2. Open the bell dropdown and inspect how they're presented.

**Test data:** One notification of each type.

**Expected result:** Each type is visually distinguishable (icon/label/color) and, ideally, filterable - a delegate scanning quickly during a busy event should be able to tell a time-sensitive meeting request apart from a general announcement at a glance.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-UX-010 — Low priority

**What it's testing:** Toast/snackbar notifications during a burst of activity (e.g. several requests arriving close together) stack legibly rather than overlapping or disappearing too fast to read.

**Steps:**

Trigger 4-5 toast-generating events in quick succession (e.g. via the TC-NG-003 style burst) and observe the on-screen toast stack.

**Test data:** 4-5 near-simultaneous toast-triggering events.

**Expected result:** Toasts stack in a readable list (or queue sensibly) rather than overlapping illegibly or all disappearing before any can be read - each should remain visible long enough to be read even if several arrive close together.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Login & Session

### TC-LS-001 — High priority

**What it's testing:** Individual (non-Shared) delegate account logged in from two devices simultaneously.

**Steps:**

1. Log in with a single INDIVIDUAL access-type delegate account from Device 1.
2. Without logging out, log in with the same credentials from Device 2.
3. Perform a booking action on Device 1; check whether/how Device 2 reflects it.

**Test data:** One Individual-access delegate; two concurrent device sessions.

**Expected result:** Determine and document actual product behaviour: either (a) the second login is blocked/warns that the account is already active elsewhere, or (b) both sessions are allowed and must then stay consistent - an action in Device 1 (e.g. booking a meeting) must be reflected in Device 2 after refresh/real-time push, never silently lost or overwritten. Whichever behaviour is intended, it must be applied consistently and communicated to the user, not left as an undefined race.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-002 — High priority

**What it's testing:** Forgot Password / Reset Password flow for both delegate and organizer accounts.

**Steps:**

1. From the login page, click 'Forgot Password'.
2. Enter the registered USERNAME (not email -- the field is username-only) and submit.
3. Open the reset email in Mailpit, click the link (https://.../reset-password?token=...).
4. On the reset form, set a new password meeting all 5 live-checked rules (8+ chars, uppercase, lowercase, number, special character) and confirm it.
5. Attempt to log in with the OLD password, then the NEW password.
6. Reuse the same reset link a second time.

**Test data:** Valid registered organizer/delegate username (NOT email).

**Expected result:** VERIFIED mechanics: submitting a valid username shows 'Sending...' then 'Check Your Email / Password reset link has been sent to your email address.' and delivers a real email via Mailpit (subject 'Reset Password Link') within seconds, containing a one-time /reset-password?token=<opaque> link. The reset form itself enforces 5 password rules live as you type (checklist with checkmarks) and blocks submission until all pass, plus a Confirm Password match check. NOT YET VERIFIED (stopped short deliberately -- see Additional Comments): actually consuming the token would rotate the shared QA-org password documented in KNOWLEDGE.md/.env.example and break every other spec that logs in as QEO1-0147. Still needs: OLD password stops working immediately after reset, NEW password works immediately, and the SAME link is rejected as single-use/expired on a second attempt -- execute this sub-part on a disposable test account, not the shared QA org.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-005 — High priority

**What it's testing:** Two organizer/admin users editing the SAME event's Settings simultaneously - each changes a different field and both Save within the same second.

**Steps:**

1. Log in as Organizer-1 and Organizer-2 (two admin accounts with access to the same event).
2. Both open Settings; Organizer-1 changes Field A, Organizer-2 changes Field B.
3. Both click Save at the same instant.
4. Reload Settings and check the final state of both fields.

**Test data:** Two concurrent admin sessions editing different fields of the same event's Settings.

**Expected result:** The final saved state is at minimum internally consistent - never a corrupted merge combining half of one save with a stale copy of the other in a way that reintroduces an old value for a field neither of them intended to change (a classic 'read-modify-write on the whole settings blob' bug). Ideally, the second saver is warned ('This was just updated by another admin - review before saving') before overwriting. Document actual behaviour either way, since silent last-write-wins on a whole-object save is a common real bug class.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-003 — Medium priority

**What it's testing:** Session expiry/timeout while an action is mid-flight.

**Steps:**

1. Log in as a delegate; leave the session idle beyond the configured timeout.
2. Attempt an action (e.g. Accept a pending meeting request).
3. Separately, time the idle-expiry to hit exactly while an Accept click is in flight to the server.

**Test data:** Session idle beyond configured timeout threshold.

**Expected result:** After timeout, the attempted action prompts re-authentication (e.g. redirect to login with a 'session expired' message) rather than silently failing or appearing to succeed while doing nothing. If the session expires at the exact moment an action was mid-flight, no partial/inconsistent booking state is created - the action either fully completes (if the server had already accepted it before expiry) or is fully rejected, never half-applied.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-006 — Medium priority

**What it's testing:** Account lockout after repeated failed login attempts.

**Steps:**

1. Attempt login with a valid username and a wrong password repeatedly (e.g. 5-10 times).
2. Observe whether/when the account locks.
3. Attempt login with the CORRECT password immediately after a couple of genuine typos (not a lockout scenario) to confirm legitimate users aren't penalised too aggressively.

**Test data:** Valid username; deliberately wrong password, repeated attempts.

**Expected result:** After a defined threshold, further attempts are blocked (temporarily or via a challenge, e.g. CAPTCHA/cooldown) with a clear message - not silently allowing unlimited brute-force attempts. A legitimate user who mistypes their password 1-2 times and then enters it correctly is NOT locked out - the threshold must be high enough to avoid false positives on normal user error.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-007 — Medium priority

**What it's testing:** Password change while another session of the same account is active elsewhere.

**Steps:**

1. Log in on Device 1.
2. On Device 2 (already logged in with the same account), go to account settings and change the password.
3. Attempt a sensitive action on Device 1 without re-logging in.

**Test data:** Same account, two active sessions; password changed from one of them.

**Expected result:** Device 1's session is either force-logged-out or blocked from further sensitive actions promptly after the password change on Device 2 - it must not be able to continue operating indefinitely on the now-superseded credential.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-008 — Medium priority

**What it's testing:** Timezone correctness for delegates in different timezones viewing the SAME slot, including its interaction with the booking-race tests.

**Steps:**

1. Set two test delegate accounts/browsers to different timezones (e.g. one matching the venue timezone, one several hours offset).
2. Both view the same underlying slot on Agenda.
3. Confirm the displayed time is correctly converted (or consistently shown in venue time, whichever is the intended design) for each.
4. Re-run TC-CC-001 (Case 1 race) with A and B in different timezones from each other.

**Test data:** Two delegate accounts/browsers set to different timezones; same underlying slot.

**Expected result:** The slot's displayed time is correct and unambiguous for both timezones per the product's intended design (converted-to-local or fixed-venue-time - either is acceptable if consistent and clearly labelled, e.g. 'venue time'). Critically, the Case 1 race outcome from TC-CC-001 is unaffected by A and B being in different timezones - a timezone display quirk must never be the actual cause of, or a mask for, a real booking race bug.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-010 — Medium priority

**What it's testing:** Forgot Password request has no visible rate limiting per username.

**Steps:**

1. Submit a valid username on /auth/password/forgot.
2. Immediately (within ~10s) submit the SAME username again.
3. Check Mailpit for how many reset emails were actually sent.

**Test data:** One valid username, submitted twice in quick succession.

**Expected result:** VERIFIED: two requests ~8 seconds apart both succeeded with no cooldown/CAPTCHA/error shown, and both delivered a separate 'Reset Password Link' email via Mailpit. No throttling was observed at this spacing. Worth confirming whether any rate limit exists at all (e.g. after 10+ rapid requests), since an unthrottled reset-email endpoint is a mail-bombing / abuse vector against any known username.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-LS-011 — Medium priority

**What it's testing:** Reset-password form: live password-strength checklist and Confirm-Password mismatch handling.

**Steps:**

1. Open a valid (unused) reset-password link.
2. Type into New Password one rule at a time (e.g. '1', 'a', 'A', '1a', 'Aa1', 'Aa1!') and observe the 5-rule checklist (8+ chars / uppercase / lowercase / number / special character) update live.
3. Enter a value satisfying all 5 rules, then type a DIFFERENT value into Confirm Password.
4. Attempt to submit.

**Test data:** Reset token from a genuine 'Reset Password Link' email.

**Expected result:** VERIFIED the 5-rule checklist exists and updates its checkmark per rule as each character is typed (e.g. typing a digit alone immediately ticks 'A number' while leaving the other 4 unticked). NOT YET VERIFIED: whether the Reset Password button stays disabled until all 5 rules pass, and the exact message/behaviour when Confirm Password does not match New Password. Execute against a disposable account's reset link, not a shared fixture.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Super Admin

### TC-SA-003 — Medium priority

**What it's testing:** Super Admin's own Profile dialog (Submit Feedback / Change Password / Logout) and session invalidation on logout.

**Steps:**

1. Log in as Super Admin.
2. Click the User Profile icon (top-right) to open the profile dialog.
3. Note name/role/email shown and the 3 actions offered.
4. Test Logout: clone the session's refreshToken into a second context first, then Logout from the first, then check whether the second context's session also dies (same method as TC-LS-004).

**Test data:** Active Super Admin session.

**Expected result:** profile dialog shows name, 'Super Admin' role label, and email, plus 'Submit Feedback', 'Change Password', 'Logout' -- identical pattern to the organizer profile dialog. NOT YET VERIFIED: whether Logout invalidates a cloned-cookie session the same way it does for organizer (TC-LS-004 confirmed this for organizer; re-run the same check for Super Admin to confirm parity).

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SA-004 — Medium priority

**What it's testing:** Cross-role login attempts are correctly rejected (Super Admin creds on a delegate slug login, etc.).

**Steps:**

1. Attempt to log in on a delegate event-slug login widget using a Super Admin or Organizer username/password.
2. Attempt to log in on the generic /auth/login form using a delegate username.
3. Confirm each is rejected with an appropriate message, not silently misrouted.

**Test data:** Super Admin, Organizer, and Delegate credentials, each tried on the wrong login surface.

**Expected result:** Each cross-role attempt is rejected with a clear message (delegate creds on /auth/login already documented to return 'Invalid Login. Kindly connect with event organizer...' per KNOWLEDGE.md) -- confirm the reverse direction (admin/organizer creds on a delegate slug widget) behaves equivalently rather than, say, silently failing open or crashing the delegate widget.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-SA-005 — Low priority

**What it's testing:** Super Admin > Event Organizers: view/manage an organizer, and whether Super Admin can impersonate (log in as) an organizer.

**Steps:**

1. Super Admin > Event Organizers > open an existing organizer.
2. Look for any 'Login as' / impersonation action alongside view/edit.
3. If present, use it and confirm what session is created (a real organizer session? does it get logged/audited? how do you return to the Super Admin session afterwards?).

**Test data:** Any existing organizer in the Event Organizers list.

**Expected result:** If impersonation exists, it needs its own dedicated test cases (audit trail, ability to cleanly return to the Super Admin session, whether the organizer is notified). If it does not exist, this case can be closed as N/A -- confirm which, since it changes the shape of any future Super Admin test cases.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Concurrency - Race Conditions

**Plain-English version of these:** every one of these is really just "two things happen at the SAME time — does the app handle that cleanly, or does it break?" The simplest way to test any of them yourself: open 2 browser tabs/windows side by side, log in as two different people (or the same admin twice), get BOTH tabs ready to do their action, then click both buttons as close together as you can (within a second or two is good enough — doesn't need to be perfectly exact). Then check: did only ONE thing win cleanly, or did something break/duplicate/get stuck?

### TC-CC-002 — Critical priority

**In plain words:** Two people both try to book the same person for the same time slot, at the same time — and that person has auto-accept turned ON.

**How to test it:** Open 2 browser tabs. Log in as two different delegates (Alex and Blake) in each. In the target person's settings, turn ON 'auto accept meeting request'. In both tabs, get to the point of clicking 'Book Meeting' for the SAME target person and SAME time slot — then click both buttons as close together as you can (have a friend help, one click each, at the same time).

**What should happen:** Only ONE of the two should end up actually booked. The other should get a clear message that the slot is taken — not a silent freeze, not both showing 'confirmed'.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CC-004 — Critical priority

**In plain words:** Same as above, but with 3, then 5, then 10 people all trying to book the same popular person's same slot at once.

**How to test it:** This one is hard to do manually with real clicking — you'd need 10 people clicking at once. Simplify it: just do it with 3 people (3 browser tabs, 3 delegate logins) all clicking Book on the same target/slot together.

**What should happen:** Exactly one person gets the slot. The other 2 (or 9) get a clear 'slot no longer available' message — nobody sees a fake 'success'.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CC-005 — Critical priority

**In plain words:** Same race, but the target is a Sponsor instead of a regular delegate, and the sponsor's auto-accept is OFF.

**How to test it:** Same as TC-CC-002 but pick a Sponsor as the target instead of a delegate, and make sure auto-accept is OFF for them.

**What should happen:** Only one request should end up confirmed/pending correctly. No double-booking.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CC-006 — Critical priority

**In plain words:** Same as above, but the sponsor's auto-accept is ON.

**How to test it:** Same as TC-CC-005 but turn auto-accept ON for the sponsor first.

**What should happen:** Only one request wins. The loser gets a clear message, not a silent hang.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CC-007 — Critical priority

**In plain words:** A really popular sponsor's one open slot gets requested by a big crowd of people all at once (10-50 people).

**How to test it:** This needs a lot of people clicking at once, which is hard to do by hand. Simplify: do it with 3-4 delegates in 3-4 browser tabs, all clicking to book the same sponsor's same slot together.

**What should happen:** Exactly one wins the slot, everyone else gets a clean 'not available' message — no double-bookings, no crashes.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-005 — Critical priority

**In plain words:** The organizer manually books two people together for a slot, at the exact same moment one of those people is independently requesting someone else for that same slot.

**How to test it:** As Organizer, go to Manual Booking and get ready to book Alex+Blake for a specific slot. In another tab as Blake, get ready to independently request that same slot with a third person. Click both actions together.

**What should happen:** The slot should not end up double-booked (Blake in two meetings at once for the same time). One action should win cleanly.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-007 — Critical priority

**In plain words:** A big batch of old pending requests (20-50 of them) all hit their 24-hour auto-accept deadline at the same time.

**How to test it:** This one is very hard to test by hand (needs waiting 24 real hours, or a way to fast-forward time, which we don't have). Best to just skip this one or ask the dev team how their scheduler batch-processes these — it's more of a backend/engineering question than a click-through test.

**What should happen:** N/A - flag as 'needs backend/dev team input, not manually testable'.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-006 — Critical priority

**In plain words:** The organizer changes an agenda's meeting length/timing (which reshuffles all the time slots) at the exact moment a delegate already has confirmed meetings booked in the OLD time slots.

**How to test it:** Set up an agenda with a couple of confirmed meetings already booked. As organizer, edit that agenda's meeting duration or gap time (which regenerates the slots) right after.

**What should happen:** The already-confirmed meetings should NOT just disappear or get silently messed up — document what actually happens to them (do they stay honored, get flagged, or get lost?).

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CC-009 — High priority

**In plain words:** Lots of people booking DIFFERENT, unrelated slots all at the same moment — just checking nothing gets mixed up between unrelated bookings.

**How to test it:** Open a few browser tabs with different delegates. Have each one book a DIFFERENT person for a DIFFERENT slot, all around the same time.

**What should happen:** Every booking should go through correctly and separately — nobody's booking should show up on someone else's meeting by mistake.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-003 — High priority

**In plain words:** One person cancels their meeting request at the exact moment the other person accepts it.

**How to test it:** Get a pending request ready (Alex requests Blake). In one tab, Alex clicks 'Withdraw/Cancel request'. In the other tab, Blake clicks 'Accept'. Click both at the same time.

**What should happen:** It should end up as ONE clear outcome (either cancelled or confirmed) — not both, and not stuck in a weird in-between state.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-008 — High priority

**In plain words:** Two people who SHARE one login (a 'Shared Access' delegate account) both use it at the same time to book two different meetings.

**How to test it:** Find or create a Shared-Access delegate account. Log into it in 2 browser tabs at once (same username/password in both). In each tab, book a different meeting.

**What should happen:** Both bookings should go through fine as long as they're not conflicting with each other — the shared login shouldn't cause one to overwrite the other.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-009 — High priority

**In plain words:** You're looking at the agenda page, and while you're just sitting there (not clicking anything), someone else books the slot you're looking at. Does your screen catch up to reality?

**How to test it:** Open the Agenda page as Alex and just leave it open. In another tab, have Blake book that same slot Alex is looking at. Go back to Alex's tab — try to book that same slot now.

**What should happen:** Alex's screen should either refresh to show the slot is taken, or if Alex tries to book it anyway, get a clear 'sorry, just got taken' message — not a confusing silent failure.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-010 — High priority

**In plain words:** Checking that a sponsor's single physical table can't get double-booked for the same time slot, no matter which of the two different ways someone books it (delegate booking it themselves vs. organizer manually booking it).

**How to test it:** Pick a sponsor with exactly one fixed table. In one tab, have a delegate try to book that sponsor's slot themselves. In another tab, as Organizer, try to manually book someone else into that exact same sponsor/slot. Do both around the same time.

**What should happen:** Only one should succeed. The table should never end up double-booked for the same time.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-002 — High priority

**In plain words:** Two admins flip the same event's Active/Inactive switch in opposite directions at the same time.

**How to test it:** Log in as the organizer in 2 tabs (or use Super Admin in one). In one tab, turn the event ON. In the other, turn it OFF. Click both close together.

**What should happen:** The event should end up in ONE clear state (either on or off), matching whichever click the system decided was 'last' — not stuck in a broken middle state.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-004 — High priority

**In plain words:** Two admins both create a new agenda time-block for the same day, and the times they pick overlap each other.

**How to test it:** Open Agenda page in 2 tabs. In both, start adding a new meeting block for the same day, with overlapping times (e.g. one picks 2-4pm, other picks 3-5pm). Save both around the same time.

**What should happen:** Document what happens - does it block the second overlapping save, or does it silently create both (which would be a real bug since slots would double-book)?

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-007 — High priority

**In plain words:** The organizer deletes an entire agenda day that has confirmed meetings in it, at the same moment a delegate is trying to cancel one of those very meetings.

**How to test it:** Have a confirmed meeting on a specific agenda day. As organizer, delete that whole agenda day/block. At the same time, as the delegate, try to cancel that same meeting.

**What should happen:** No crash, no error page — the system should handle both actions gracefully, ending in one consistent state (meeting is gone either way).

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-010 — High priority

**In plain words:** Two DIFFERENT delegates both get promoted to the SAME sponsor category (like 'Diamond') at the exact same time, and that category only has a couple of physical tables.

**How to test it:** Pick a sponsor category with a fixed table type (limited seats). Promote two different delegates to that same category, at the same time, from 2 tabs.

**What should happen:** Both should get assigned to DIFFERENT tables (not the same one) if tables are available - document what happens if the tables run out.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-012 — High priority

**In plain words:** The organizer edits the Table Configuration (like removing a table type) at the exact moment someone's meeting request is being processed against that same table.

**How to test it:** Have a meeting request in progress that uses a specific table type. As organizer, edit or remove that table type from Table Configuration right around the same time.

**What should happen:** Document what happens to the in-flight meeting request - it shouldn't silently corrupt or assign to a table that no longer exists.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CR-006 — Medium priority

**In plain words:** The organizer turns on 'Auto Rejection' while there are already some pending meeting requests waiting.

**How to test it:** Get 2-3 pending requests waiting (don't accept/reject them yet). As organizer, go to Settings and turn ON 'Auto Rejection'. Save. Check what happened to the pending requests.

**What should happen:** Document what actually happens — do the already-pending requests get auto-rejected immediately, or do they stay pending until their own timer runs out? Either could be correct, just note which one it does.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-003 — Medium priority

**In plain words:** One admin clicks 'Activate Event' while another admin clicks 'Cancel Event' for the same event at the same time.

**How to test it:** Same setup as above — 2 tabs, one clicks Activate, the other clicks Cancel (with a reason), at the same time.

**What should happen:** One action should win cleanly. The event's final status should match whichever one 'won', not be confused/mixed.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-CE-005 — Medium priority

**In plain words:** Just clicking Save twice really fast on a new Agenda entry, to make sure it doesn't create it twice.

**How to test it:** Fill out a new agenda block. Double-click the Save button quickly (or click it, then immediately click again before the page responds).

**What should happen:** Only ONE agenda block should get created, not two duplicates.

**What actually happened:** _______________________________________________

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## EO-Delegate Profile

### TC-EOT-009 — High priority

**What it's testing:** In Delegate mode, the EO can send and receive meeting requests like a normal delegate

**Steps:**

1. Toggle into Delegate mode
2. Send a meeting request to another delegate
3. Have that delegate accept it

**Test data:** N/A

**Expected result:** Request is sent, appears in the recipient's pending list, and once accepted shows correctly in the EO's (as delegate) eMeeting list

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-EOT-005 — Medium priority

**What it's testing:** Toggle state is scoped per event for an EO managing multiple events

**Steps:**

1. EO manages Event A and Event B
2. Toggle into Delegate mode while viewing Event A
3. Switch the active event to Event B

**Test data:** EO with 2 events

**Expected result:** Event B is shown in Organizer mode (toggle does not carry over across events); each event's toggle state is independent

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-EOT-008 — Medium priority

**What it's testing:** Toggling in one browser tab does not corrupt the EO session in another tab

**Steps:**

1. Open the app in two tabs logged in as the same EO
2. Toggle to Delegate mode in Tab 1
3. Interact with Tab 2

**Test data:** Two tabs, same account

**Expected result:** Tab 2 either reflects the new mode consistently or continues to function correctly in its previous mode — no broken/mixed session state in either tab

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-EOT-012 — Low priority

**What it's testing:** Rapid double-clicking the toggle switch does not leave the UI in an inconsistent state

**Steps:**

1. Double-click the EO-Delegate toggle switch as fast as possible

**Test data:** N/A

**Expected result:** UI settles into one definitive, correct mode (Organizer or Delegate) — not a half-switched or visually broken state

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Timeslots & Agenda

### TC-TG-001 — Critical priority

**What it's testing:** Editing an Agenda's meetingDuration/gap (which regenerates the bookable slot structure) AFTER some of the existing slots are already booked.

**Steps:**

1. Create an agenda; confirm at least one meeting in a generated slot.
2. Edit the agenda's meetingDuration or gapBetweenMeetingSlots.
3. Save and inspect the fate of the previously confirmed meeting and the new slot structure.

**Test data:** Agenda with ≥1 confirmed meeting; duration/gap subsequently edited.

**Expected result:** Either the edit is blocked while confirmed bookings exist against the current structure, with a clear message identifying the conflict, or the existing confirmed meeting is explicitly preserved (kept pinned to its original time) while only the remaining unbooked slots are regenerated to the new duration/gap. The previously confirmed meeting must never silently disappear or get its time corrupted purely as a side effect of this edit.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-20 — High priority

**What it's testing:** View All Timeslot list

**Steps:**

1. Timeslots > view list

**Test data:** 7 durations in production

**Expected result:** All 7 shown: 00:15, 00:20, 00:30, 01:00, 01:30, 02:00, 03:00; each has View and Delete actions; total count matches

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-21 — High priority

**What it's testing:** View timeslot detail

**Steps:**

1. Timeslots > View on 00:15

**Test data:** Duration: 00:15

**Expected result:** Detail page opens showing duration and linked agenda/event info

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-24 — High priority

**What it's testing:** Negative duration rejected

**Steps:**

1. Add New Timeslot
2. Duration = -15
3. Submit

**Test data:** Duration: -15

**Expected result:** Validation error; negative not allowed

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-25 — High priority

**What it's testing:** Non-numeric duration rejected

**Steps:**

1. Add New Timeslot
2. Duration = 'abc'
3. Submit

**Test data:** Duration: abc

**Expected result:** Input rejected or validation error; not created

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-26 — High priority

**What it's testing:** Delete timeslot in use by active agenda

**Steps:**

1. Delete a duration currently assigned to an event agenda
2. Confirm

**Test data:** Duration used in agenda

**Expected result:** Blocked with message 'Cannot delete a timeslot in use'; or if deleted, verify delegates do not lose slots

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-28 — High priority

**What it's testing:** Edit an existing agenda item

**Steps:**

1. Agenda > select day
2. Click agenda > edit
3. Change title or time
4. Save

**Test data:** Updated title/time

**Expected result:** Agenda updated successfully!'; changes reflected on calendar and in delegate Agenda view

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-002 — High priority

**What it's testing:** Two meeting-type agenda blocks with OVERLAPPING time ranges created sequentially on the same day (not a race - basic overlap validation).

**Steps:**

1. Create Agenda Block 1: 10:00-12:00, meeting=true.
2. Create Agenda Block 2: 11:00-13:00, meeting=true, same day.
3. Save Block 2.

**Test data:** Overlapping agenda windows on the same day, created one after another.

**Expected result:** Block 2 is rejected with a clear overlap-conflict message identifying Block 1, OR (if overlapping meeting blocks are an intentional product feature for parallel meeting tracks/rooms) the two blocks generate independently bookable, non-conflicting slots and this is explicitly confirmed as intended - either way, a delegate must never be able to end up with two different confirmed meetings at literally the same clock time as a result of overlapping agenda blocks.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-006 — High priority

**What it's testing:** Deleting an Agenda day/block that has confirmed meetings booked into it.

**Steps:**

1. Create an agenda block with ≥2 confirmed meetings.
2. Attempt to delete the block.
3. Observe the result and, if deletion is allowed, check notifications sent to every affected delegate/sponsor.

**Test data:** Agenda block with confirmed meetings, deletion attempted.

**Expected result:** Deletion is either blocked with a clear message listing the conflicting confirmed meetings, or explicitly cascades the cancellation with a notification sent to every affected party - confirmed meetings must never silently vanish from delegates' Agenda/Meetings pages with no explanation.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-22 — Medium priority

**What it's testing:** Cancel Add New Timeslot returns without saving

**Steps:**

1. Add New Timeslot
2. Enter 45
3. Click Cancel

**Test data:** Duration typed: 45

**Expected result:** Back to list; no new row; count unchanged

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-23 — Medium priority

**What it's testing:** Duration stored as minutes, displayed as HH:MM

**Steps:**

1. Add timeslot with Duration = 90
2. View in list

**Test data:** Duration: 90 min

**Expected result:** Displayed as '01:30' (HH:MM conversion correct)

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-27 — Medium priority

**What it's testing:** Duplicate duration

**Steps:**

1. Add New Timeslot
2. Duration = 15 (00:15 already exists)
3. Submit

**Test data:** Duration: 15 (duplicate)

**Expected result:** Duplicate prevented with error, or duplicate created — verify and log behaviour

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-29 — Medium priority

**What it's testing:** View All Day Agenda

**Steps:**

1. Agenda > View All Day Agenda button

**Test data:** Event day with agenda

**Expected result:** Full day agenda view opens showing all agenda blocks for the selected day

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TS-30 — Medium priority

**What it's testing:** Clean View button

**Steps:**

1. Agenda > Clean View

**Test data:** Calendar with agenda

**Expected result:** Clean/simplified view of agenda renders without sidebar or extra controls

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-004 — Medium priority

**What it's testing:** A shared Timeslot duration (from the Timeslots library) currently used by an ACTIVE agenda is edited.

**Steps:**

1. Create a Timeslot duration (e.g. 00:15) and an agenda using it, with confirmed bookings.
2. Attempt to edit that Timeslot duration's value directly from the Timeslots list.
3. Observe whether/how the change propagates to the already-generated agenda slots.

**Test data:** Timeslot duration in active use, edited directly.

**Expected result:** Editing a duration in active use is either blocked with a clear 'in use by N agendas' message (consistent with TC-TS-26's delete-blocking behaviour, merged suite), or explicitly does NOT retroactively alter already-generated slots/bookings for agendas that already used the old value - whichever is intended, it must be deliberate and not silently corrupt live bookings.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-003 — Low priority

**What it's testing:** gapBetweenMeetingSlots = 0 (fully back-to-back slots, no buffer).

**Steps:**

1. Create a meeting agenda with meetingDuration=15, gap=0.
2. Inspect generated slot times and book meetings in two consecutive slots.

**Test data:** Duration 15, gap 0.

**Expected result:** Either accepted (slots run truly back-to-back, e.g. 10:00-10:15 then 10:15-10:30) with no functional issue for the delegate transitioning between two consecutive confirmed meetings, or rejected with a clear minimum-gap validation message if a buffer is required by design - document which is intended.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-005 — Low priority

**What it's testing:** Extremely small (1-minute) and extremely large (8+ hour) meeting durations.

**Steps:**

1. Create a meeting agenda with meetingDuration=1 minute across a 1-hour window; inspect the generated slot count/list rendering.
2. Create a second agenda with meetingDuration=8 hours (single slot); inspect booking flow and Live Meetings display.

**Test data:** Duration=1 min (many slots) and duration=8 hours (one slot).

**Expected result:** Both extremes remain usable: the many-small-slots case renders and scrolls correctly without performance issues or visual overlap in the slot picker; the one-giant-slot case books and displays correctly in Live Meetings/Agenda without any duration-formatting bug (e.g. '08:00' rendering oddly).

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-TG-007 — Low priority

**What it's testing:** Agenda Notes/Remarks with very long rich-text content and embedded images near any size limit.

**Steps:**

1. Agenda > Agenda Notes > enter a long formatted remark (several paragraphs, bold/lists) plus one or more embedded images at or near the platform's upload size limit.
2. Save and view on both the organizer and delegate side.

**Test data:** Long rich-text remark with embedded images near the size limit.

**Expected result:** Save succeeds (or fails with a clear size-limit message if exceeded) and the remark renders correctly and fully on both organizer and delegate views without breaking page layout or silently truncating content.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Registration Links

### TC-RL-N01 — High priority

**What it's testing:** Open an expired registration link

**Steps:**

1. Use a registration link whose expiry date has passed2. Open it

**Test data:** Expiry: yesterday

**Expected result:** Link shows expired/invalid; registration blocked

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-RL-004 — Medium priority

**What it's testing:** Filter registration links by status

**Steps:**

1. Registration Links
2. Use Filters = Active / Expired

**Test data:** Mixed link statuses

**Expected result:** List filters correctly by chosen status

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-RL-04 — Medium priority

**What it's testing:** Delete a registration link

**Steps:**

1. Registration Links > Delete on a link
2. Confirm

**Test data:** Existing link

**Expected result:** Link deleted; count decrements

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-RL-005 — Low priority

**What it's testing:** Empty state when no links

**Steps:**

1. Event with no registration links
2. Open Registration Links

**Test data:** No links

**Expected result:** 'No links found' empty state shown

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

## Notif-Annc-Feedback

### TC-FB-005 — High priority

**What it's testing:** Organizer sees feedback in admin Feedback list

**Steps:**

1. Feedback (organizer side) > view list

**Test data:** Submitted feedback from TC-FB-01

**Expected result:** Feedback appears with Delegate info, subject, rating/type, created date

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-FB-006 — High priority

**What it's testing:** Organizer replies to feedback

**Steps:**

1. Feedback > find submission
2. Reply button
3. Enter message > Save

**Test data:** Feedback with reply

**Expected result:** Reply saved; delegate sees reply when they view their feedback; 'Reply sent successfully!'

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-NG-004 — High priority

**What it's testing:** The actual notification/email text content is correct and non-contradictory for the concurrent Accept-vs-Reject and Cancel-vs-Accept races (content-level regression check on TC-CR-002 and TC-CR-003).

**Steps:**

1. Re-run TC-CR-002 (Accept vs Reject race) and TC-CR-003 (Cancel vs Accept race).
2. This time, capture and read the FULL text of every notification/email sent to every party, not just the final booking status.

**Test data:** Same setup as TC-CR-002 / TC-CR-003.

**Expected result:** Exactly one outcome notification is sent per party, and its wording matches the true final state precisely - the requester never receives, for example, both a 'Your meeting is confirmed' email and a 'Your request was rejected' email for the same request, even if one of them was generated by a since-overridden intermediate state. If the system briefly computes an intermediate state internally, no notification may be dispatched for that intermediate state - only for the final, settled outcome.

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-FB-002 — Medium priority

**What it's testing:** Feedback required fields

**Steps:**

1. Submit Feedback with empty Type/Subject
2. Submit

**Test data:** Missing fields

**Expected result:** Validation prevents submit

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-NG-003 — Medium priority

**What it's testing:** Notification bell badge count stays exactly accurate when several notifications arrive within the same second (e.g. during a booking-window-open race burst).

**Steps:**

1. Trigger 5+ notification-generating events for the same recipient within roughly the same second (e.g. via a scripted burst).
2. Immediately check the bell badge count against the actual number of notification records created.

**Test data:** 5+ near-simultaneous notification-triggering events for one recipient.

**Expected result:** The badge count exactly matches the true number of new notifications, with no off-by-one or lost-increment error - concurrent increments to the same counter are themselves a small-scale instance of the same race-condition class as the booking races, and must be verified the same way (repeat the burst 5-10 times, not once).

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-002 — Medium priority

**What it's testing:** Feedback shows a 'Replied' status once the organizer responds

**Steps:**

1. Organizer replies to a delegate's feedback
2. Delegate reopens the Feedback section

**Test data:** N/A

**Expected result:** That feedback item's status updates to 'Replied' and the organizer's reply text is visible to the delegate

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-004 — Medium priority

**What it's testing:** Feedback text exceeding the maximum character limit is rejected/handled

**Steps:**

1. Enter feedback text longer than the field's max length
2. Submit

**Test data:** Text > max length (e.g. 5000+ chars)

**Expected result:** Field enforces the limit with a clear message (or truncates), and does not error out or save corrupted data

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-006 — Medium priority

**What it's testing:** Delegate cannot edit/delete feedback after the organizer has replied

**Steps:**

1. Have a feedback item that already received an organizer reply
2. Attempt to edit or delete it

**Test data:** Feedback with existing reply

**Expected result:** Edit/delete controls are disabled or the action is rejected once a reply exists, preserving the reply thread's integrity

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-FB-003 — Low priority

**What it's testing:** Filter feedback by type

**Steps:**

1. Feedbacks
2. Switch Feedback type filter

**Test data:** Multiple feedback types

**Expected result:** List filters to chosen type

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-003 — Low priority

**What it's testing:** Delegate submits duplicate feedback of the same type in quick succession

**Steps:**

1. Submit a feedback item
2. Immediately submit another of the identical type/content

**Test data:** Same feedback text twice

**Expected result:** Either both are accepted as distinct entries, or a duplicate-submission warning is shown — behavior is consistent and does not silently drop data

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-005 — Low priority

**What it's testing:** Delegate can filter their own feedback history by type/status

**Steps:**

1. Use the type/status filter on the Feedback history view

**Test data:** N/A

**Expected result:** List filters correctly to show only feedback matching the selected type/status

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---

### TC-DFB-008 — Low priority

**What it's testing:** Delegate receives a notification when the organizer replies to feedback

**Steps:**

1. Organizer replies to a delegate's feedback
2. Check the delegate's notification bell/inbox

**Test data:** N/A

**Expected result:** A notification referencing the feedback reply appears for the delegate

**Actual result:** _______________________________________________

**Status:** [ ] Pass  [ ] Fail  [ ] Blocked  [ ] N/A

---
