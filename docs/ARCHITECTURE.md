# Architecture Overview

This document describes the architecture of the POS Back Office application.

## System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                         POS ECOSYSTEM                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐         ┌─────────────┐ │
│  │  POS App     │         │   Firebase   │         │ Back Office │ │
│  │  (Android)   │◄───────►│  Firestore   │◄───────►│   (Web)     │ │
│  │              │         │              │         │             │ │
│  │  • Sales     │         │  • Products  │         │ • Dashboard │ │
│  │  • Checkout  │         │  • Sales     │         │ • Inventory │ │
│  │  • Payments  │         │  • Returns   │         │ • Reports   │ │
│  │  • Receipts  │         │  • Settings  │         │ • Settings  │ │
│  └──────────────┘         └──────────────┘         └─────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Application Architecture

The Back Office follows a **feature-based** architecture with clear separation of concerns.

### Directory Structure

```
src/
├── app/                    # Next.js App Router (Pages)
│   ├── (auth)/            # Auth-required routes (grouped)
│   │   ├── layout.tsx     # Auth layout with session check
│   │   ├── page.tsx       # Dashboard (default)
│   │   ├── inventory/     # Inventory management
│   │   ├── sales/         # Sales history
│   │   ├── reports/       # Reports and analytics
│   │   └── settings/      # App settings
│   ├── login/             # Public login page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── components/
│   ├── ui/                # shadcn/ui primitives (Button, Card, etc.)
│   ├── app-sidebar.tsx    # Main navigation sidebar
│   ├── providers.tsx      # Context providers (React Query, etc.)
│   └── [feature]/         # Feature-specific components
│       ├── product-table.tsx
│       ├── sales-chart.tsx
│       └── ...
│
├── lib/
│   ├── firebase.ts        # Firebase app initialization
│   ├── firestore.ts       # Firestore helpers and queries
│   ├── auth.ts            # Authentication utilities
│   └── utils.ts           # General utilities
│
├── hooks/
│   ├── use-products.ts    # Product data hooks
│   ├── use-sales.ts       # Sales data hooks
│   ├── use-auth.ts        # Auth state hook
│   └── use-mobile.ts      # Responsive detection
│
├── stores/
│   └── auth-store.ts      # Zustand auth store
│
└── types/
    └── index.ts           # TypeScript type definitions
```

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Pages** (`app/`) | Route handling, layout, data fetching boundaries | `app/inventory/page.tsx` |
| **Components** | UI rendering, user interaction | `ProductTable`, `SalesChart` |
| **Hooks** | Data fetching, state management | `useProducts()`, `useSales()` |
| **Lib** | External service integration | Firebase, API clients |
| **Stores** | Global client state | Auth state, UI preferences |
| **Types** | Type definitions | `Product`, `Sale`, `User` |

## Data Flow

### Read Operations (Queries)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Page      │───►│   Hook      │───►│  React      │───►│  Firestore  │
│ Component   │    │ useProducts │    │  Query      │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                                     │
       │                                     │
       └─────────────────────────────────────┘
                    Cached Data
```

### Write Operations (Mutations)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│   Form      │───►│  Mutation   │───►│  Firestore  │
│  Action     │    │ Component   │    │   Hook      │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │   Cache     │
                                    │ Invalidate  │
                                    └─────────────┘
```

## State Management

### Server State (React Query)

All data from Firestore is managed via React Query:

```typescript
// hooks/use-products.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
    staleTime: 60 * 1000, // 1 minute
  });
}
```

### Client State (Zustand)

UI state and auth are managed via Zustand:

```typescript
// stores/auth-store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  logout: () => set({ user: null }),
}));
```

### Form State (React Hook Form)

Form state is managed locally with React Hook Form + Zod:

```typescript
const schema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

const form = useForm({ resolver: zodResolver(schema) });
```

## Security Model

### Authentication

- Firebase Auth handles user authentication
- Session tokens stored in HTTP-only cookies (for SSR)
- Auth state synchronized via `onAuthStateChanged`

### Role-Based Access Control (RBAC)

The system implements a granular permission system with 16 permissions across 6 categories:

```typescript
// User roles
type Role = 'admin' | 'manager' | 'cashier';

// Permission categories
const PERMISSIONS = {
  // Inventory
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_EDIT: "inventory:edit",
  INVENTORY_DELETE: "inventory:delete",

  // Sales
  SALES_VIEW: "sales:view",
  SALES_VOID: "sales:void",
  SALES_REFUND: "sales:refund",

  // Reports
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",

  // Users
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",

  // Locations
  LOCATIONS_VIEW: "locations:view",
  LOCATIONS_CREATE: "locations:create",
  LOCATIONS_EDIT: "locations:edit",
  LOCATIONS_DELETE: "locations:delete",
};
```

### Default Role Permissions

| Role | Default Permissions |
|------|-------------------|
| **Admin** | All 16 permissions |
| **Manager** | Inventory (all), Sales (all), Reports (all), Settings (view), Users (view), Locations (view) |
| **Cashier** | Inventory (view), Sales (view), Reports (view) |

### Permission Checking

```typescript
// In components, use the useCurrentUser hook
const { hasPermission, isAdmin } = useCurrentUser();
const canCreate = hasPermission(PERMISSIONS.INVENTORY_CREATE);

// Conditional rendering based on permissions
{canCreate && <Button>Add Product</Button>}
```

### Data Isolation

All Firestore queries are scoped to tenant:

```typescript
// Always include tenant filter
const productsRef = collection(db, `tenants/${tenantId}/products`);
```

## Location Management

The system supports multiple store locations, each with its own configuration:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LOCATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tenant                                                             │
│  └── Locations                                                      │
│      ├── Location 1 (Downtown Store)                               │
│      │   ├── name, address, timezone, currency                     │
│      │   └── isActive: true                                        │
│      ├── Location 2 (Mall Kiosk)                                   │
│      │   └── ...                                                   │
│      └── Location 3 (Airport)                                      │
│          └── isActive: false (deactivated)                         │
│                                                                     │
│  Users can be assigned to multiple locations                        │
│  Default location can be set for receipt headers                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Location Model

```typescript
interface Location {
  id: string;
  tenantId: string;
  name: string;        // "Downtown Store"
  address: string;     // Full address
  timezone: string;    // "America/New_York"
  currency: string;    // "USD"
  isActive: boolean;   // Soft delete support
}
```

## Settings Architecture

Settings are split across three documents for clear ownership:

```
tenants/{tenantId}/settings/
├── global     # Managed by Back Office, read by Android app
├── app        # Managed by Android app, read by Back Office
└── backoffice # Web-only settings (future)
```

### Settings Split

| Document | Owner | Contents |
|----------|-------|----------|
| **global** | Back Office | Business info, tax, currency, payment methods, defaultLocationId, payment gateway configs |
| **app** | Android App | Printer settings, receipt sharing preferences |
| **backoffice** | Back Office | Dashboard layout preferences (future) |

### Settings Flow

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Back Office   │────────►│   Firestore  │◄────────│   Android App   │
│                 │         │              │         │                 │
│  Writes:        │         │  global      │         │  Reads:         │
│  - global       │         │  app         │         │  - global       │
│                 │         │  backoffice  │         │                 │
│  Reads:         │         │              │         │  Writes:        │
│  - app          │         │              │         │  - app          │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Key Patterns

### 1. Server Components vs Client Components

```typescript
// Server Component (default) - for static content, data fetching
// app/inventory/page.tsx
export default async function InventoryPage() {
  const products = await getProducts(); // Server-side fetch
  return <ProductTable products={products} />;
}

// Client Component - for interactivity
// components/product-table.tsx
'use client';
export function ProductTable({ products }: Props) {
  const [search, setSearch] = useState('');
  // Interactive filtering
}
```

### 2. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newProduct) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['products']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['products']);

    // Optimistically update
    queryClient.setQueryData(['products'], (old) =>
      old.map(p => p.id === newProduct.id ? newProduct : p)
    );

    return { previous };
  },
  onError: (err, newProduct, context) => {
    // Rollback on error
    queryClient.setQueryData(['products'], context.previous);
  },
});
```

### 3. Real-time Updates

```typescript
// Subscribe to Firestore changes
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, `tenants/${tenantId}/products`),
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      queryClient.setQueryData(['products'], products);
    }
  );
  return unsubscribe;
}, [tenantId]);
```

## Performance Considerations

### Bundle Size

- Use dynamic imports for large components
- Tree-shake unused shadcn components
- Analyze with `npm run build` output

### Data Fetching

- Implement pagination for large lists (>100 items)
- Use Firestore indexes for complex queries
- Cache aggressively with React Query

### Rendering

- Use `React.memo()` for expensive list items
- Virtualize long lists with `@tanstack/react-virtual`
- Avoid unnecessary re-renders with proper key usage

## Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit | Vitest | `__tests__/unit/` |
| Component | React Testing Library | `__tests__/components/` |
| E2E | Playwright | `e2e/` |
| API | MSW (Mock Service Worker) | `__mocks__/` |

## Deployment

### Vercel (Recommended)

- Automatic deployments on push
- Preview deployments for PRs
- Edge functions for API routes

### Environment Variables

Required for deployment:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_TENANT_ID` - Default tenant identifier

## Related Documents

- [Development Guidelines](./DEVELOPMENT.md)
- [Adding Features](./ADDING_FEATURES.md)
- [Firebase Integration](./FIREBASE.md)
- [Component Patterns](./COMPONENTS.md)
