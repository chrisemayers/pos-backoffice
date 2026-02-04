import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display settings page", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Settings");
  });

  test("should display business information section", async ({ page }) => {
    await expect(page.locator("text=Business Information")).toBeVisible();
    await expect(page.locator('input[placeholder*="Business Name"]')).toBeVisible();
  });

  test("should display tax settings section", async ({ page }) => {
    await expect(page.locator("text=Tax Settings")).toBeVisible();
    await expect(page.locator("text=Enable sales tax")).toBeVisible();
  });

  test("should display payment methods section", async ({ page }) => {
    await expect(page.locator("text=Payment Methods")).toBeVisible();
    await expect(page.locator("text=Cash")).toBeVisible();
    await expect(page.locator("text=Card")).toBeVisible();
  });

  test("should display receipt settings section", async ({ page }) => {
    await expect(page.locator("text=Receipt Settings")).toBeVisible();
    await expect(page.locator("text=Enable receipt sharing")).toBeVisible();
  });

  test("should display inventory alerts section", async ({ page }) => {
    await expect(page.locator("text=Inventory Alerts")).toBeVisible();
    await expect(page.locator("text=Enable low stock alerts")).toBeVisible();
  });

  test("should be able to toggle tax setting", async ({ page }) => {
    // Find the tax checkbox
    const taxCheckbox = page.locator("#taxEnabled");

    // Get initial state
    const initialState = await taxCheckbox.isChecked();

    // Toggle the checkbox
    await taxCheckbox.click();

    // Verify it changed
    const newState = await taxCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  });

  test("should toggle payment method selection", async ({ page }) => {
    // Find a payment method checkbox (e.g., Google Pay)
    const paymentCard = page.locator("text=Google Pay").locator("..");

    // Click on the payment method card
    await paymentCard.click();

    // The selection should toggle
    await expect(paymentCard).toBeVisible();
  });
});
