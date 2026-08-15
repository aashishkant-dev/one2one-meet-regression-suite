import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.use.baseURL || 'https://one2one.techarttrekkies.com.np';
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  // Test credentials - Update these with actual test accounts
  const testAccounts = {
    organizer: {
      email: 'organizer@techarttrekkies.com.np',
      password: 'TestPass@123',
    },
    delegateA: {
      email: 'delegate.a@techarttrekkies.com.np',
      password: 'TestPass@123',
    },
    delegateB: {
      email: 'delegate.b@techarttrekkies.com.np',
      password: 'TestPass@123',
    },
    delegateC: {
      email: 'delegate.c@techarttrekkies.com.np',
      password: 'TestPass@123',
    },
    sponsor: {
      email: 'sponsor@techarttrekkies.com.np',
      password: 'TestPass@123',
    },
  };

  // Save test accounts to a file for use in tests
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, 'test-data.json'),
    JSON.stringify({ baseURL, testAccounts }, null, 2)
  );

  console.log('✓ Global setup completed. Test data saved to test-data.json');

  await browser.close();
}

export default globalSetup;
