import { test, expect } from '../support/fixtures/test-base';
import { DelegateFeedbackPage } from '../support/pages/DelegateFeedbackPage';

/**
 * Gap-fill for delegate-side Feedback - the merged register's Feedback cases (TC-FB-001..006)
 * only covered submission; nothing exercised the delegate's own history/status view.
 * Executed live on staging 2026-08-12 as bookingDelegateBPage (Blake).
 */
test.describe('Delegate Feedback', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Delegate Feedback' });
  });

  test('TC-DFB-001 delegate submits feedback and sees it appear in their own history', async ({ bookingDelegateBPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const feedback = new DelegateFeedbackPage(bookingDelegateBPage);
    await feedback.goto();
    const subject = `Regression smoke feedback ${Date.now()}`;
    await feedback.submit({ type: 'Event Feedback', subject, comment: 'Automated regression smoke test comment.' });
    await expect(feedback.row(subject)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-DFB-007 feedback subject/comment containing a script payload is stored inert (no script execution)', async ({ bookingDelegateBPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const feedback = new DelegateFeedbackPage(bookingDelegateBPage);
    await feedback.goto();
    const subject = `XSS-check <script>window.__xss=true</script> ${Date.now()}`;
    await feedback.submit({ type: 'Event Feedback', subject, comment: '<script>window.__xss=true</script>' });
    await bookingDelegateBPage.waitForTimeout(1500);
    const xssFired = await bookingDelegateBPage.evaluate(() => (window as any).__xss === true);
    expect(xssFired).toBe(false);
  });
});
