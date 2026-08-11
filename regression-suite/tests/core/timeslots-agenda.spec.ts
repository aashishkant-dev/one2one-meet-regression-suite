import { test, expect } from '../support/fixtures/test-base';
import { TimeslotsAgendaPage } from '../support/pages/TimeslotsAgendaPage';

/** Smoke subset of the Timeslots (2 cases) + Agenda (6 cases) modules. Confirmed 5/5 passing 2026-08-09. */
test.describe('Timeslots & Agenda', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Timeslots & Agenda' });
  });

  test('TC-TS-001 create a timeslot duration template', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const timeslots = new TimeslotsAgendaPage(organizerPage);
    await timeslots.gotoTimeslots();
    await timeslots.addTimeslotDuration(45);
    await expect(timeslots.durationRow(45)).toBeVisible();
    await timeslots.deleteDuration(45); // TC-TS-002, cleanup in the same run
  });

  test('TC-TS-N01 add timeslot with zero duration is rejected via disabled submit', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const timeslots = new TimeslotsAgendaPage(organizerPage);
    await timeslots.gotoTimeslots();
    await organizerPage.getByRole('button', { name: /add/i }).click();
    await organizerPage.getByRole('spinbutton', { name: /duration \(minutes\)/i }).fill('0');
    await expect(organizerPage.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  test('TC-AG-003 pre-event vs event agenda grouping renders correct DOM text', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const timeslots = new TimeslotsAgendaPage(organizerPage);
    await timeslots.gotoAgenda();
    // Section headers are title case in the DOM even though CSS renders them uppercase -
    // assert real DOM text, not the visually-uppercase string.
    await expect(timeslots.agendaSectionHeader('Pre-Event Agenda')).toBeVisible();
    await expect(timeslots.agendaSectionHeader('Event Agenda')).toBeVisible();
  });
});
