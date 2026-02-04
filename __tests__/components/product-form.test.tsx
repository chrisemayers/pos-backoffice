import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/inventory/product-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the useCategories hook
vi.mock("@/hooks/use-products", () => ({
  useCategories: () => ({
    data: ["Electronics", "Clothing", "Food"],
    isLoading: false,
    error: null,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("ProductForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/product name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/barcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/low stock alert level/i)).toBeInTheDocument();
  });

  it("allows typing in the category input field", async () => {
    const user = userEvent.setup();

    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Find the category text input
    const categoryInput = screen.getByPlaceholderText(/type or select a category/i) as HTMLInputElement;
    expect(categoryInput).toBeInTheDocument();

    // Type a new category
    await user.type(categoryInput, "NewCategory");

    // Check that the input value was updated
    expect(categoryInput.value).toBe("NewCategory");
  });

  it("updates category input value when typing character by character", async () => {
    const user = userEvent.setup();

    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    const categoryInput = screen.getByPlaceholderText(/type or select a category/i) as HTMLInputElement;

    // Type characters incrementally using userEvent
    await user.type(categoryInput, "A");
    expect(categoryInput.value).toBe("A");

    await user.type(categoryInput, "BC");
    expect(categoryInput.value).toBe("ABC");
  });

  it("submits form with typed category value", async () => {
    const user = userEvent.setup();

    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Fill in required fields using userEvent
    await user.type(screen.getByLabelText(/product name \*/i), "Test Product");
    await user.type(screen.getByLabelText(/price \*/i), "9.99");
    await user.type(screen.getByLabelText(/stock \*/i), "10");

    // Type category using userEvent (now using register instead of Controller)
    const categoryInput = screen.getByPlaceholderText(/type or select a category/i);
    await user.type(categoryInput, "CustomCategory");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /create product/i });
    await user.click(submitButton);

    // Verify the submit was called with the correct category
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Product",
          price: 9.99,
          stock: 10,
          category: "CustomCategory",
        })
      );
    });
  });

  it("validates that category is required", async () => {
    const user = userEvent.setup();

    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Fill in other required fields but leave category empty
    await user.type(screen.getByLabelText(/product name \*/i), "Test Product");
    await user.type(screen.getByLabelText(/price \*/i), "9.99");
    await user.type(screen.getByLabelText(/stock \*/i), "10");

    // Try to submit
    const submitButton = screen.getByRole("button", { name: /create product/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });

    // Submit should not have been called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("populates form with existing product data", () => {
    const existingProduct = {
      id: "1",
      name: "Existing Product",
      price: 19.99,
      priceCents: 1999,
      stock: 25,
      category: "Electronics",
      barcode: "123456",
      stockAlertLevel: 5,
      isDeleted: false,
    };

    render(
      <ProductForm
        product={existingProduct}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/product name \*/i)).toHaveValue("Existing Product");
    expect(screen.getByLabelText(/price \*/i)).toHaveValue(19.99);
    expect(screen.getByLabelText(/stock \*/i)).toHaveValue(25);

    // Check that the category input shows the existing value
    const categoryInput = screen.getByPlaceholderText(/type or select a category/i);
    expect(categoryInput).toHaveValue("Electronics");
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when isLoading is true", () => {
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
