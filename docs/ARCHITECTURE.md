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

### Authorization

```typescript
// Roles and permissions
type Role = 'admin' | 'manager' | 'cashier';

const permissions: Record<Role, string[]> = {
  admin: ['*'],  // All permissions
  manager: ['read:*', 'write:inventory', 'write:settings'],
  cashier: ['read:products', 'read:sales'],
};
```

### Data Isolation

All Firestore queries are scoped to tenant:

```typescript
// Always include tenant filter
const productsRef = collection(db, `tenants/${tenantId}/products`);
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
