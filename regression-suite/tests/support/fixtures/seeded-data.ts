/**
 * Non-secret reference data about the QA E2E staging fixtures, captured in
 * KNOWLEDGE.md (2026-08-09 session). Passwords live in .env, not here.
 * If these fixtures no longer exist (org deleted, re-seeded, etc.), specs
 * that depend on them will fail fast and loudly - rebuild via Super Admin >
 * Event Organizers > Add New Organizer > Seed Demo Data, then re-derive the
 * Booking Test Event as described in the README.
 */
export const seededData = {
  org: {
    company: 'QA E2E Org 1786259627695',
  },
  pastEvent: {
    id: 359,
    name: 'Past Event',
    dates: '26 Jul - 27 Jul 2026',
    delegateCount: 20, // 5 shared + 15 individual
    sponsors: ['Helio Global', 'Quanta Technologies', 'Vertex Ventures', 'Nimbus Holdings', 'Onyx Networks', 'Meridian Solutions'],
    knownUnpromotedDelegates: ['Echo Industries', 'Atlas Group'],
  },
  currentEvent: {
    id: 360,
    name: 'Current Event',
    delegateCount: 6,
    sponsorCount: 6,
  },
  bookingTestEvent: {
    id: 362,
    name: 'Booking Test Event',
    dates: '06-07 Sep 2026',
    bookingWindow: { start: '2026-08-03', end: '2026-09-05' },
    delegates: ['BTE-BDC-alex', 'BTE-BEC-blake'],
    totalTimeslots: 48, // 24 fifteen-minute slots/day x 2 days, 09:00-17:00
  },
} as const;
