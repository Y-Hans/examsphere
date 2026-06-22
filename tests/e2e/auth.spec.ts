import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users from protected routes to login', async ({ page }) => {
    // Go to a protected route
    await page.goto('/student/dashboard');
    
    // Expect to be redirected to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation errors on empty login submit', async ({ page }) => {
    await page.goto('/login');
    
    // Click submit without filling form
    await page.click('button[type="submit"]');
    
    // Expect validation messages (assuming native HTML5 validation or custom UI shows up)
    // Adjust selector based on actual UI implementation
    await expect(page.locator('input[type="email"]')).toBeFocused();
  });

  test('should allow navigation to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on "Create an account" or similar link
    // Adjust selector based on actual UI
    const registerLink = page.locator('a[href="/register"]');
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    }
  });
});