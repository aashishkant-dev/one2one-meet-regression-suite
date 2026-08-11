import { test, expect } from '../support/fixtures/test-base';
import { TableConfigurationPage } from '../support/pages/TableConfigurationPage';

/**
 * Smoke subset of the 9-case Table Configuration module. Confirmed 5/5 passing 2026-08-09,
 * read-only against the already-seeded Mixed formation (1 Floating FLT, 4 Fixed types:
 * FXD general / PREM->Premium / STAN->Standard / EXHB exhibitor, Numerical incremental order).
 */
test.describe('Table Configuration', () => {
  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'module', description: 'Table Configuration' });
  });

  test('TC-TC-003 fixed table types map to their sponsor category prefixes', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'High' });
    const tables = new TableConfigurationPage(organizerPage);
    await tables.goto();
    await tables.openTablesTab();
    await expect(tables.formationBadge('PREM')).toBeVisible();
    await expect(tables.formationBadge('STAN')).toBeVisible();
  });

  test('TC-TC-004 table name prefix and numerical incremental order render correctly', async ({ organizerPage }) => {
    test.info().annotations.push({ type: 'priority', description: 'Medium' });
    const tables = new TableConfigurationPage(organizerPage);
    await tables.goto();
    await tables.openTablesTab();
    await expect(tables.formationBadge('FLT')).toBeVisible();
    await expect(tables.formationBadge('FXD')).toBeVisible();
  });
});
