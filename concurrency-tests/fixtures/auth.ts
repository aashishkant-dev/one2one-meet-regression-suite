import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for login page to load
  await page.waitForURL(/login|signin/i, { timeout: 10000 }).catch(() => {});

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
  }

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(password);
  }

  // Click login
  const loginBtn = page.locator('button:has-text("Log In"), button:has-text("Sign In"), button:has-text("Login")').first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  }

  // Wait for navigation
  await page.waitForURL(/dashboard|delegate|organizer|events/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  try {
    const profileMenu = page.locator('[data-testid="profile-menu"], .user-menu, .profile-icon').first();
    if (await profileMenu.isVisible({ timeout: 5000 })) {
      await profileMenu.click();
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForURL(/login|signin/i, { timeout: 10000 });
      }
    }
  } catch (e) {
    console.log('Logout failed, clearing cookies instead');
    await page.context().clearCookies();
  }
}

export async function getAuthToken(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('token'));
  return authCookie?.value || '';
}
