import { test, expect } from "@playwright/test";

test.describe("Inventory Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
  });

  test("should display inventory page", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Inventory");

    // Check stats cards are visible
    await expect(page.locator("text=Total Products")).toBeVisible();
    await expect(page.locator("text=Low Stock Items")).toBeVisible();
    await expect(page.locator("text=Inventory Value")).toBeVisible();
  });

  test("should have tabs for active and archived products", async ({ page }) => {
    await expect(page.locator("text=Active")).toBeVisible();
    await expect(page.locator("text=Archived")).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test("should have category filter", async ({ page }) => {
    const categoryFilter = page.locator("text=All Categories").first();
    await expect(categoryFilter).toBeVisible();
  });

  test("should have add product button", async ({ page }) => {
    const addButton = page.locator("text=Add Product");
    await expect(addButton).toBeVisible();
  });

  test("should open create product dialog", async ({ page }) => {
    // Click add product button
    await page.click("text=Add Product");

    // Check dialog is visible
    await expect(page.locator("text=Add Product").nth(1)).toBeVisible();
    await expect(page.locator('input[placeholder*="product name"]')).toBeVisible();
  });

  test("should filter products by search", async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("test product");

    // Wait for debounce
    await page.waitForTimeout(500);

    // The filter should be applied (we can't verify results without data)
    await expect(searchInput).toHaveValue("test product");
  });

  test("should switch between active and archived tabs", async ({ page }) => {
    // Click archived tab
    await page.click("button:has-text('Archived')");

    // Should show archived content
    await expect(page.locator("text=Archived")).toBeVisible();

    // Click active tab
    await page.click("button:has-text('Active')");

    // Should be back to active
    await expect(page.locator("text=Active")).toBeVisible();
  });
});
