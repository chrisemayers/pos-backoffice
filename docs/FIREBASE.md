# Firebase Integration Guide

This document covers Firebase integration for the POS Back Office application.

## Overview

The Back Office shares a Firebase project with the Android POS App, enabling real-time data synchronization between both platforms.

### Shared Resources

| Resource | Usage |
|----------|-------|
| **Firestore** | Primary database for products, sales, returns |
| **Authentication** | User management and access control |
| **Storage** | Product images, report exports (future) |
| **Analytics** | Usage tracking (optional) |

## Configuration

### Environment Setup

Create `.env.local` with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Application Configuration
NEXT_PUBLIC_TENANT_ID=your-tenant-id
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (same as POS App)
3. Click the gear icon → Project settings
4. Scroll to "Your apps" section
5. Click "Add app" → Web
6. Copy the configuration values

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

## Firestore Data Structure

### Collection Hierarchy

```
firestore/
├── tenants/
│   └── {tenantId}/
│       ├── products/           # Product catalog
│       │   └── {productId}
│       ├── sales/              # Sales transactions
│       │   └── {saleId}
│       ├── saleItems/          # Sale line items
│       │   └── {saleItemId}
│       ├── returns/            # Return transactions
│       │   └── {returnId}
│       ├── settings/           # App configuration
│       │   └── main
│       └── feedback/           # User feedback
│           └── {feedbackId}
```

### Document Schemas

#### Products Collection

```typescript
interface ProductDocument {
  // Identifiers
  id: string;                    // Auto-generated
  barcode?: string;              // Optional barcode

  // Basic Info
  name: string;
  category: string;

  // Pricing (store both for precision)
  price: number;                 // Dollar amount (e.g., 9.99)
  priceCents: number;           // Cents amount (e.g., 999)

  // Inventory
  stock: number;
  stockAlertLevel: number;       // Low stock threshold

  // Status
  isDeleted: boolean;            // Soft delete flag

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Sales Collection

```typescript
interface SaleDocument {
  id: string;
  receiptId: string;             // Format: YYYYMMDD-NNN

  // Legacy single-product fields (deprecated)
  productId?: string;
  quantity?: number;

  // Payment
  paymentType: string;           // 'cash', 'google_pay', 'wipay'
  gatewayTransactionId?: string;

  // Amounts
  totalPrice: number;
  totalPriceCents: number;
  discount: number;
  discountCents: number;
  changeDue: number;
  changeDueCents: number;

  // Metadata
  timestamp: Timestamp;
  tenant_id: string;
}
```

#### Sale Items Collection

```typescript
interface SaleItemDocument {
  id: string;
  saleId: string;                // Reference to parent sale
  productId: string;             // Reference to product
  quantity: number;
  unitPrice: number;
  unitPriceCents: number;
}
```

#### Returns Collection

```typescript
interface ReturnDocument {
  id: string;
  originalSaleId: string;        // Reference to original sale
  timestamp: Timestamp;
  refundAmount: number;
  gatewayRefundId?: string;
  tenant_id: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}
```

## Firebase Initialization

### Client-Side Initialization

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
auth = getAuth(app);

export { app, db, auth };
```

## Firestore Queries

### Basic CRUD Operations

```typescript
// src/lib/firestore/products.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!;

// Helper to get collection reference
function getCollection(name: string) {
  return collection(db, `tenants/${TENANT_ID}/${name}`);
}

// READ: Fetch all products
export async function fetchProducts() {
  const q = query(
    getCollection('products'),
    where('isDeleted', '==', false),
    orderBy('name')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// READ: Fetch single product
export async function fetchProduct(id: string) {
  const docRef = doc(getCollection('products'), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() };
}

// CREATE: Add new product
export async function createProduct(data: Omit<Product, 'id'>) {
  const docRef = await addDoc(getCollection('products'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return { id: docRef.id, ...data };
}

// UPDATE: Update product
export async function updateProduct(id: string, data: Partial<Product>) {
  const docRef = doc(getCollection('products'), id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// DELETE: Soft delete product
export async function deleteProduct(id: string) {
  const docRef = doc(getCollection('products'), id);
  await updateDoc(docRef, {
    isDeleted: true,
    updatedAt: Timestamp.now(),
  });
}
```

### Pagination

```typescript
// Paginated fetch
export async function fetchProductsPaginated(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot
) {
  let q = query(
    getCollection('products'),
    where('isDeleted', '==', false),
    orderBy('name'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const hasMore = snapshot.docs.length === pageSize;

  return { products, lastVisible, hasMore };
}
```

### Complex Queries

```typescript
// Sales by date range
export async function fetchSalesByDateRange(
  startDate: Date,
  endDate: Date
) {
  const q = query(
    getCollection('sales'),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }));
}

// Low stock products
export async function fetchLowStockProducts() {
  // Note: This requires a composite index
  const q = query(
    getCollection('products'),
    where('isDeleted', '==', false),
    where('stock', '<=', 10),  // Or use stockAlertLevel
    orderBy('stock', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

### Real-time Subscriptions

```typescript
import { onSnapshot, Query } from 'firebase/firestore';

// Subscribe to products collection
export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    getCollection('products'),
    where('isDeleted', '==', false),
    orderBy('name')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(products);
    },
    onError
  );
}

// Usage in React component
useEffect(() => {
  const unsubscribe = subscribeToProducts(
    (products) => setProducts(products),
    (error) => console.error('Subscription error:', error)
  );

  return () => unsubscribe();
}, []);
```

## Firestore Indexes

Complex queries require composite indexes. Create these in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "stock", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sales",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sales",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "paymentType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Security Rules

### Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check tenant access
    function hasTenantAccess(tenantId) {
      return isAuthenticated() &&
             request.auth.token.tenant_id == tenantId;
    }

    // Tenant data
    match /tenants/{tenantId}/{document=**} {
      allow read, write: if hasTenantAccess(tenantId);
    }
  }
}
```

### Setting Custom Claims

Custom claims (like `tenant_id`) must be set server-side via Firebase Admin SDK:

```typescript
// Firebase Cloud Function or Admin SDK
import { getAuth } from 'firebase-admin/auth';

export async function setUserTenant(uid: string, tenantId: string) {
  await getAuth().setCustomUserClaims(uid, { tenant_id: tenantId });
}
```

## Authentication

### Sign In Flow

```typescript
// src/lib/auth.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

### Auth State Hook

```typescript
// src/hooks/use-auth.ts
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
}
```

### Protected Routes

```typescript
// src/app/(auth)/layout.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}
```

## Error Handling

### Firestore Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `permission-denied` | Security rules blocked request | Check auth and rules |
| `not-found` | Document doesn't exist | Verify document ID |
| `unavailable` | Service temporarily unavailable | Retry with backoff |
| `resource-exhausted` | Quota exceeded | Check usage limits |

### Error Handling Pattern

```typescript
import { FirebaseError } from 'firebase/app';

export async function safeFirestoreCall<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'permission-denied':
          return { data: null, error: 'You do not have permission to perform this action' };
        case 'not-found':
          return { data: null, error: 'The requested resource was not found' };
        case 'unavailable':
          return { data: null, error: 'Service temporarily unavailable. Please try again.' };
        default:
          return { data: null, error: err.message };
      }
    }
    return { data: null, error: 'An unexpected error occurred' };
  }
}
```

## Testing with Emulators

### Setup Local Emulators

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Start emulators: `firebase emulators:start`

### Connect to Emulators

```typescript
// src/lib/firebase.ts
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

if (process.env.NODE_ENV === 'development' && process.env.USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Related Documents

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guidelines](./DEVELOPMENT.md)
- [Adding Features](./ADDING_FEATURES.md)
- [Component Patterns](./COMPONENTS.md)
