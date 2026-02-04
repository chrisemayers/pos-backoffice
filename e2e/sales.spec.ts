import { test, expect } from "@playwright/test";

test.describe("Sales History Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sales");
  });

  test("should display sales history page", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Sales History");

    // Check stats cards are visible
    await expect(page.locator("text=Today's Sales")).toBeVisible();
    await expect(page.locator("text=Today's Revenue")).toBeVisible();
    await expect(page.locator("text=Average Order")).toBeVisible();
  });

  test("should have date range filter", async ({ page }) => {
    // Check date range selector exists
    await expect(page.locator("text=Today")).toBeVisible();
  });

  test("should have payment type filter", async ({ page }) => {
    // Check payment filter exists
    await expect(page.locator("text=All Payments")).toBeVisible();
  });

  test("should have receipt search input", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="receipt"]');
    await expect(searchInput).toBeVisible();
  });

  test("should change date range filter", async ({ page }) => {
    // Click on date range selector
    await page.click("text=Today");

    // Check dropdown options
    await expect(page.locator("text=Last 7 Days")).toBeVisible();
    await expect(page.locator("text=Last 30 Days")).toBeVisible();
    await expect(page.locator("text=All Time")).toBeVisible();

    // Select Last 7 Days
    await page.click("text=Last 7 Days");

    // Filter should be applied
    await expect(page.locator("button:has-text('Last 7 Days')")).toBeVisible();
  });

  test("should change payment type filter", async ({ page }) => {
    // Click on payment filter
    await page.click("text=All Payments");

    // Check dropdown options
    await expect(page.locator("[role='option']:has-text('Cash')")).toBeVisible();
    await expect(page.locator("[role='option']:has-text('Card')")).toBeVisible();

    // Select Cash
    await page.click("[role='option']:has-text('Cash')");

    // Filter should be applied
    await expect(page.locator("button:has-text('Cash')")).toBeVisible();
  });
});
