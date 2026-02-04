import { test, expect } from "@playwright/test";

test.describe("Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
  });

  test("should display reports page", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Reports");

    // Check key metrics are visible
    await expect(page.locator("text=Total Revenue")).toBeVisible();
    await expect(page.locator("text=Transactions")).toBeVisible();
    await expect(page.locator("text=Average Order")).toBeVisible();
  });

  test("should have period selector", async ({ page }) => {
    // Check period selector exists
    await expect(page.locator("text=This Week")).toBeVisible();
  });

  test("should change report period", async ({ page }) => {
    // Click on period selector
    await page.click("button:has-text('This Week')");

    // Check dropdown options
    await expect(page.locator("[role='option']:has-text('This Month')")).toBeVisible();
    await expect(page.locator("[role='option']:has-text('Last 7 Days')")).toBeVisible();
    await expect(page.locator("[role='option']:has-text('Last 30 Days')")).toBeVisible();

    // Select This Month
    await page.click("[role='option']:has-text('This Month')");

    // Period should be updated
    await expect(page.locator("button:has-text('This Month')")).toBeVisible();
  });

  test("should display top products section", async ({ page }) => {
    await expect(page.locator("text=Top Selling Products").first()).toBeVisible();
  });

  test("should display period comparison", async ({ page }) => {
    await expect(page.locator("text=Period Comparison")).toBeVisible();
  });

  test("should show percentage change indicators", async ({ page }) => {
    // Look for percentage indicators (positive or negative)
    const percentageIndicator = page.locator("text=/%/");
    await expect(percentageIndicator.first()).toBeVisible({ timeout: 10000 });
  });
});
