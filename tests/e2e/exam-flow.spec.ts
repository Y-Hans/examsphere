import { test, expect } from '@playwright/test';

test.describe('Exam Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth - in real E2E, you'd log in via the UI
    // or set cookies directly
  });

  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Crack JEE & NEET');
  });

  test('should redirect to login from protected route', async ({ page }) => {
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation error on empty registration', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    // HTML5 validation should prevent form submission
    await expect(page).toHaveURL('/register');
  });
});
