import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessInfoForm } from "@/components/settings/business-info-form";
import { TaxSettingsForm } from "@/components/settings/tax-settings-form";
import type { Settings } from "@/types";

const defaultSettings: Settings = {
  taxEnabled: false,
  taxRate: "0",
  businessName: "Test Store",
  businessAddress: "123 Main St",
  businessWebsite: "https://teststore.com",
  businessPhone: "555-1234",
  showBusinessInfo: true,
  receiptSharingEnabled: true,
  stockLevelAlertsEnabled: true,
  acceptedPaymentMethodIds: ["cash", "card"],
  printerEnabled: false,
  currencyCode: "USD",
};

describe("Settings Forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BusinessInfoForm", () => {
    it("should render with initial values", () => {
      const onSubmit = vi.fn();
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      expect(screen.getByLabelText(/business name/i)).toHaveValue("Test Store");
      expect(screen.getByLabelText(/address/i)).toHaveValue("123 Main St");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("555-1234");
      expect(screen.getByLabelText(/website/i)).toHaveValue(
        "https://teststore.com"
      );
    });

    it("should show business info checkbox checked when showBusinessInfo is true", () => {
      const onSubmit = vi.fn();
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /show business info on receipts/i,
      });
      expect(checkbox).toBeChecked();
    });

    it("should disable submit button when form is pristine", () => {
      const onSubmit = vi.fn();
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is dirty", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/business name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "New Store Name");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      expect(submitButton).toBeEnabled();
    });

    it("should call onSubmit with form data when submitted", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/business name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Store");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            businessName: "Updated Store",
            businessAddress: "123 Main St",
            businessPhone: "555-1234",
            businessWebsite: "https://teststore.com",
            showBusinessInfo: true,
          })
        );
      });
    });

    it("should show validation error for empty business name", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<BusinessInfoForm settings={defaultSettings} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/business name/i);
      await user.clear(nameInput);

      // Trigger blur to show validation
      fireEvent.blur(nameInput);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should show loading state when isLoading is true", () => {
      const onSubmit = vi.fn();
      render(
        <BusinessInfoForm
          settings={defaultSettings}
          onSubmit={onSubmit}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("TaxSettingsForm", () => {
    it("should render with tax disabled by default", () => {
      const onSubmit = vi.fn();
      render(<TaxSettingsForm settings={defaultSettings} onSubmit={onSubmit} />);

      const taxCheckbox = screen.getByRole("checkbox", {
        name: /enable sales tax/i,
      });
      expect(taxCheckbox).not.toBeChecked();
    });

    it("should not show tax rate input when tax is disabled", () => {
      const onSubmit = vi.fn();
      render(<TaxSettingsForm settings={defaultSettings} onSubmit={onSubmit} />);

      expect(screen.queryByLabelText(/tax rate/i)).not.toBeInTheDocument();
    });

    it("should show tax rate input when tax is enabled", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const settingsWithTax = { ...defaultSettings, taxEnabled: true, taxRate: "10" };
      render(<TaxSettingsForm settings={settingsWithTax} onSubmit={onSubmit} />);

      expect(screen.getByLabelText(/tax rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax rate/i)).toHaveValue(10);
    });

    it("should toggle tax rate visibility when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TaxSettingsForm settings={defaultSettings} onSubmit={onSubmit} />);

      // Tax rate should not be visible initially
      expect(screen.queryByLabelText(/tax rate/i)).not.toBeInTheDocument();

      // Enable tax
      const taxCheckbox = screen.getByRole("checkbox", {
        name: /enable sales tax/i,
      });
      await user.click(taxCheckbox);

      // Tax rate should now be visible
      expect(screen.getByLabelText(/tax rate/i)).toBeInTheDocument();
    });

    it("should call onSubmit with tax settings when submitted", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const settingsWithTax = { ...defaultSettings, taxEnabled: true, taxRate: "10" };
      render(<TaxSettingsForm settings={settingsWithTax} onSubmit={onSubmit} />);

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, "15");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            taxEnabled: true,
            taxRate: "15",
          })
        );
      });
    });

    it("should disable submit button when form is pristine", () => {
      const onSubmit = vi.fn();
      render(<TaxSettingsForm settings={defaultSettings} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it("should show loading state when isLoading is true", () => {
      const onSubmit = vi.fn();
      render(
        <TaxSettingsForm
          settings={defaultSettings}
          onSubmit={onSubmit}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
