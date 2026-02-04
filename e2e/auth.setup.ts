import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Check if we need to login (might already have session)
  if (page.url().includes("/login")) {
    // Fill in login form
    // Note: Replace with test account credentials or use environment variables
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword123";

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL("/", { timeout: 10000 });
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
