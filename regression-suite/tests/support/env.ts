function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Copy .env.example to .env and fill it in (see README "Fixtures & credentials").`
    );
  }
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  stagingBaseUrl: optional('O2O_STAGING_BASE_URL', 'https://one2one.techarttrekkies.com.np'),
  stagingApiBase: optional('O2O_STAGING_API_BASE', 'https://one2one-backend.techarttrekkies.com.np'),
  mailpitBase: optional('O2O_MAILPIT_BASE', 'http://121mail.techarttrekkies.com.np'),

  get superAdminUsername() {
    return required('O2O_SUPERADMIN_USERNAME');
  },
  get superAdminPassword() {
    return required('O2O_SUPERADMIN_PASSWORD');
  },

  get orgUsername() {
    return required('O2O_ORG_USERNAME');
  },
  get orgPassword() {
    return required('O2O_ORG_PASSWORD');
  },

  bookingEventSlug: optional('O2O_BOOKING_EVENT_SLUG', 'booking-test-event-6a78985de09a0'),
  get bookingDelegateAUsername() {
    return required('O2O_BOOKING_DELEGATE_A_USERNAME');
  },
  get bookingDelegateAPassword() {
    return required('O2O_BOOKING_DELEGATE_A_PASSWORD');
  },
  get bookingDelegateBUsername() {
    return required('O2O_BOOKING_DELEGATE_B_USERNAME');
  },
  get bookingDelegateBPassword() {
    return required('O2O_BOOKING_DELEGATE_B_PASSWORD');
  },

  currentEventSlug: optional('O2O_CURRENT_EVENT_SLUG', 'current-event-6a782b73dc037'),
  get currentDelegateUsername() {
    return required('O2O_CURRENT_DELEGATE_USERNAME');
  },
  get currentDelegatePassword() {
    return required('O2O_CURRENT_DELEGATE_PASSWORD');
  },

  pastEventSlug: optional('O2O_PAST_EVENT_SLUG', 'past-event-6a782b11646d6'),
};
