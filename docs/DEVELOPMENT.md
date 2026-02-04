# Development Guidelines

This document outlines the development standards and practices for the POS Back Office application.

## Getting Started

### Prerequisites

- Node.js 20+ (use `nvm` for version management)
- npm 10+
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/pos-backoffice.git
cd pos-backoffice

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix auto-fixable lint errors |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## User Management

### Creating the First Admin User

The first admin user must be created manually in Firebase Console:

1. **Create Firebase Auth User**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Note the User UID

2. **Create Firestore User Document**
   - Go to Firestore → `tenants/{tenantId}/users`
   - Add document with ID = Firebase User UID
   - Required fields:
   ```json
   {
     "email": "admin@example.com",
     "displayName": "Admin User",
     "role": "admin",
     "permissions": [],
     "locationIds": [],
     "isActive": true,
     "tenantId": "your-tenant-id",
     "createdAt": "<server timestamp>",
     "updatedAt": "<server timestamp>"
   }
   ```

3. **Set Custom Claims** (optional, for advanced security)
   - Use Firebase Admin SDK or Cloud Function to set `tenant_id` claim

### Creating Users via Back Office

Once logged in as an admin, you can create users through the UI:

1. Navigate to **Employees** page
2. Click **Add Employee**
3. Fill in the form:
   - **Email**: User's email address
   - **Display Name**: Full name
   - **Role**: admin, manager, or cashier
   - **Locations**: Assign to one or more locations (optional)
4. Click **Save**

The user will receive an invitation email with a link to set their password.

### User Roles and Default Permissions

| Role | Default Permissions |
|------|-------------------|
| **Admin** | All 16 permissions (full access) |
| **Manager** | Inventory (all), Sales (all), Reports (all), Settings (view), Users (view), Locations (view) |
| **Cashier** | Inventory (view), Sales (view), Reports (view) |

### Customizing User Permissions

Admins can grant additional permissions beyond role defaults:

1. Go to **Employees** page
2. Click on a user
3. Click **Edit Permissions**
4. Toggle individual permissions on/off
5. Click **Save**

### Invitation Flow

1. Admin creates user with email and role
2. System generates invitation token (7-day expiry)
3. User receives email with invitation link
4. User clicks link and sets password
5. Account is activated and user can sign in

### Deactivating Users

To disable a user without deleting their data:

1. Go to **Employees** page
2. Click the menu (⋮) on the user row
3. Select **Deactivate**
4. Confirm the action

Deactivated users cannot sign in but their data remains for audit purposes.

## Permission Checks in Components

Always check permissions before rendering sensitive UI:

```typescript
'use client';

import { useCurrentUser, PERMISSIONS } from '@/hooks/use-current-user';

export function InventoryPage() {
  const { hasPermission } = useCurrentUser();

  const canCreate = hasPermission(PERMISSIONS.INVENTORY_CREATE);
  const canEdit = hasPermission(PERMISSIONS.INVENTORY_EDIT);
  const canDelete = hasPermission(PERMISSIONS.INVENTORY_DELETE);

  return (
    <div>
      {canCreate && <Button>Add Product</Button>}

      <ProductTable
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />
    </div>
  );
}
```

### Testing with Different Roles

To test permission-based behavior:

1. Create test users for each role (admin, manager, cashier)
2. Sign in as each user to verify:
   - Correct menu items are visible
   - Buttons appear/hide based on permissions
   - API calls are authorized correctly
3. Use browser dev tools to verify no sensitive data leaks

## Code Style

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Always type function parameters and return values
- Avoid `any` - use `unknown` and type guards instead

```typescript
// Good
interface Product {
  id: string;
  name: string;
  price: number;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// Bad
type Product = { id: any; name: any; price: any };
function formatPrice(price) { return `$${price.toFixed(2)}`; }
```

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Use `'use client'` directive only when necessary
- Keep components focused and small (<200 lines)

```typescript
// Good - components/product-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>${product.price.toFixed(2)}</p>
        {onEdit && (
          <button onClick={() => onEdit(product)}>Edit</button>
        )}
      </CardContent>
    </Card>
  );
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `product-card.tsx` |
| Pages | kebab-case folder + `page.tsx` | `inventory/page.tsx` |
| Hooks | camelCase with `use` prefix | `use-products.ts` |
| Types | PascalCase | `Product`, `SalesSummary` |
| Utils | camelCase | `formatCurrency.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS` |

### Imports

Use the `@/` alias for absolute imports from `src/`:

```typescript
// Good
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/types';

// Bad
import { Button } from '../../../components/ui/button';
```

Import order (enforced by ESLint):
1. React/Next.js imports
2. Third-party libraries
3. Internal components (`@/components`)
4. Internal hooks (`@/hooks`)
5. Internal utilities (`@/lib`)
6. Types
7. Styles

## Component Patterns

### Container/Presenter Pattern

Separate data fetching from presentation:

```typescript
// containers/inventory-container.tsx
'use client';

import { useProducts } from '@/hooks/use-products';
import { ProductTable } from '@/components/product-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function InventoryContainer() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return <ProductTable products={products} />;
}

// components/product-table.tsx (pure presentation)
interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <Table>
      {products.map(product => (
        <TableRow key={product.id}>
          <TableCell>{product.name}</TableCell>
          <TableCell>${product.price}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### Form Handling

Use React Hook Form with Zod for validation:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({ onSubmit }: { onSubmit: (data: ProductFormData) => void }) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
      category: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <span className="text-red-500">{form.formState.errors.name.message}</span>
      )}
      {/* ... other fields */}
    </form>
  );
}
```

### Error Handling

Use error boundaries and consistent error states:

```typescript
// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## State Management

### When to Use What

| State Type | Solution | Example |
|------------|----------|---------|
| Server data | React Query | Products, Sales, Reports |
| Form state | React Hook Form | Add/Edit forms |
| UI state (local) | `useState` | Modal open/close, tabs |
| UI state (global) | Zustand | Sidebar collapsed, theme |
| Auth state | Zustand + Firebase | Current user, permissions |
| URL state | Next.js searchParams | Filters, pagination |

### React Query Conventions

```typescript
// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/firestore';

// Query keys - use arrays for consistency
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Query hook
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters ?? {}),
    queryFn: () => fetchProducts(filters),
  });
}

// Mutation hook
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

## Testing

### Unit Tests

Test utilities and pure functions:

```typescript
// __tests__/unit/format-currency.test.ts
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(10.5)).toBe('$10.50');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-10.5)).toBe('-$10.50');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

### Component Tests

Test component behavior, not implementation:

```typescript
// __tests__/components/product-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/product-card';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 9.99,
};

describe('ProductCard', () => {
  it('displays product information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<ProductCard product={mockProduct} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });
});
```

## Git Workflow

### Branch Naming

```
feature/inventory-bulk-import
fix/sales-report-date-filter
refactor/product-table-pagination
docs/api-integration-guide
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bulk import for products
fix: correct date filtering in sales report
refactor: extract pagination logic to hook
docs: add Firebase integration guide
chore: update dependencies
test: add unit tests for formatCurrency
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with atomic commits
3. Run `npm run lint` and `npm run type-check`
4. Push and create PR
5. Ensure CI passes
6. Request review
7. Address feedback
8. Squash and merge

## Performance Guidelines

### Bundle Size

- Import only what you need from libraries
- Use dynamic imports for large components
- Check bundle with `npm run build`

```typescript
// Good - tree-shakeable
import { Button } from '@/components/ui/button';

// Bad - imports entire library
import * as UI from '@/components/ui';
```

### Data Fetching

- Always implement pagination for lists
- Use Firestore composite indexes
- Cache with appropriate stale times

### Rendering

- Use `React.memo()` for expensive list items
- Avoid inline object/function creation in JSX
- Use `key` prop correctly (avoid index for dynamic lists)

## Troubleshooting

### Common Issues

**Firebase connection errors:**
- Check `.env.local` has correct credentials
- Verify Firebase project exists and is accessible
- Check Firestore security rules

**Build failures:**
- Run `npm run type-check` for TypeScript errors
- Run `npm run lint` for ESLint errors
- Clear `.next` folder and rebuild

**Hydration errors:**
- Ensure client components have `'use client'` directive
- Don't access browser APIs in server components
- Match server and client rendered content

## Related Documents

- [Architecture Overview](./ARCHITECTURE.md)
- [Adding Features](./ADDING_FEATURES.md)
- [Firebase Integration](./FIREBASE.md)
- [Component Patterns](./COMPONENTS.md)
