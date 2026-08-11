import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/core',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // specs mutate shared staging fixtures (delegates, agendas) - keep serial per file
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'regression-log/last-run.json' }],
  ],
  use: {
    baseURL: process.env.O2O_STAGING_BASE_URL ?? 'https://one2one.techarttrekkies.com.np',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
