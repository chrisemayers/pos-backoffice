import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login");

    // Check page title - CardTitle uses data-slot attribute
    await expect(page.locator('[data-slot="card-title"]')).toContainText("POS Back Office");

    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors - message is "Invalid email address" from zod schema
    await expect(page.locator("text=Invalid email address")).toBeVisible({ timeout: 5000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Invalid email or password")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have Google sign-in button", async ({ page }) => {
    await page.goto("/login");

    // Check Google sign-in button exists
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });
});

test.describe("Protected Routes (Unauthenticated)", () => {
  test("should redirect to login when accessing inventory", async ({ page }) => {
    await page.goto("/inventory");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("should redirect to login when accessing sales", async ({ page }) => {
    await page.goto("/sales");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("should redirect to login when accessing reports", async ({ page }) => {
    await page.goto("/reports");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("should redirect to login when accessing settings", async ({ page }) => {
    await page.goto("/settings");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
