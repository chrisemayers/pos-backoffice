# Production Deployment Guide

This guide covers deploying the POS Back Office application to production.

## Pre-Deployment Checklist

### Environment Setup

- [ ] Production Firebase project created (separate from development)
- [ ] Firebase billing enabled (for production workloads)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate configured (automatic with Vercel/Firebase Hosting)

### Environment Variables

Required environment variables for production:

```env
# Firebase Configuration (Production Project)
NEXT_PUBLIC_FIREBASE_API_KEY=prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prod-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prod-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=prod_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=prod_app_id

# Tenant Configuration
NEXT_PUBLIC_TENANT_ID=your_tenant_id
```

### Firebase Project Setup

1. **Create Production Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project (e.g., `pos-backoffice-prod`)
   - Enable Google Analytics (recommended)

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider

3. **Enable Firestore**
   - Go to Firestore Database → Create database
   - Select production mode
   - Choose a region close to your users

4. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Firestore Indexes

Deploy required composite indexes:

```bash
firebase deploy --only firestore:indexes
```

Required indexes (defined in `firestore.indexes.json`):

| Collection | Fields | Query Type |
|------------|--------|------------|
| `products` | `isDeleted`, `name` | Ascending |
| `products` | `isDeleted`, `category`, `name` | Ascending |
| `sales` | `timestamp` | Descending |
| `sales` | `paymentMethod`, `timestamp` | Ascending, Descending |
| `users` | `tenantId`, `isActive` | Ascending |
| `locations` | `tenantId`, `isActive` | Ascending |

### Security Rules

Ensure production-grade Firestore security rules are deployed. Key rules:

- Tenant isolation (users can only access their tenant's data)
- Role-based access control
- Field-level validation

See [FIREBASE.md](./FIREBASE.md#security-rules) for complete rules.

---

## Initial Production Setup

After deploying the application, complete these one-time setup steps.

### Step 1: Create Tenant Document

Create your tenant structure in Firestore:

```
tenants/
└── {your-tenant-id}/
    ├── settings/
    │   ├── global    # Business settings
    │   └── app       # (Created by Android app)
    ├── products/     # Product catalog
    ├── sales/        # Sales transactions
    ├── users/        # User accounts
    └── locations/    # Store locations
```

### Step 2: Create First Admin User

**Important**: The first admin user must be created manually.

1. **Create Firebase Auth User**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter admin email and password
   - Copy the generated **User UID**

2. **Create Firestore User Document**
   - Go to Firestore → `tenants/{tenantId}/users`
   - Add document with ID = User UID
   - Document fields:
   ```json
   {
     "email": "admin@yourcompany.com",
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

3. **Verify Login**
   - Go to your production URL
   - Sign in with the admin credentials
   - Verify you have full access to all features

### Step 3: Configure Global Settings

After logging in as admin:

1. Navigate to **Settings**
2. Configure:
   - Business Name
   - Business Phone
   - Business Website
   - Tax settings (enable/disable, rate)
   - Currency
   - Payment methods

3. Click **Save**

### Step 4: Create Locations (Optional)

If using multi-location support:

1. Navigate to **Locations**
2. Click **Add Location**
3. Enter:
   - Location name (e.g., "Downtown Store")
   - Full address
   - Timezone
   - Currency
4. Repeat for each location

### Step 5: Set Default Location for Receipts (Optional)

1. Navigate to **Settings**
2. Under "Default Location", select a location
3. This location's name and address will appear on receipts

### Step 6: Create Additional Users

1. Navigate to **Employees**
2. Click **Add Employee**
3. Enter email, display name, and role
4. Assign to locations if applicable
5. User will receive invitation email

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the best integration with Next.js.

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the `POS_Backoffice` directory

2. **Configure Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Variables are encrypted at rest

3. **Deploy**
   - Vercel automatically deploys on push to `main`
   - Preview deployments for pull requests

4. **Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

### Option 2: Firebase Hosting

Use Firebase Hosting for a fully Firebase-integrated deployment.

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configure `firebase.json`**
   ```json
   {
     "hosting": {
       "source": ".",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "frameworksBackend": {
         "region": "us-central1"
       }
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Option 3: Docker

For self-hosted deployments:

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build and Run**
   ```bash
   docker build -t pos-backoffice .
   docker run -p 3000:3000 --env-file .env.production pos-backoffice
   ```

---

## Post-Deployment Verification

After deploying, verify the application is working correctly.

### Authentication Verification

- [ ] Admin can log in
- [ ] Invalid credentials show error message
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes

### Firestore Connection

- [ ] Products load on Inventory page
- [ ] Sales load on Sales page
- [ ] Settings save and persist
- [ ] Real-time updates work (test with two browser tabs)

### Permission Verification

- [ ] Admin has full access
- [ ] Manager has restricted access (no user/location management)
- [ ] Cashier has view-only access

### Settings Sync

- [ ] Settings saved in Back Office appear in Android app
- [ ] Default location appears on Android receipts

---

## Monitoring & Alerts

### Firebase Console Monitoring

1. **Usage & Billing**
   - Set budget alerts in Firebase Console
   - Monitor Firestore read/write operations

2. **Authentication**
   - Monitor sign-in activity
   - Review failed authentication attempts

3. **Firestore**
   - Monitor database usage
   - Check for slow queries

### Error Tracking (Recommended)

Consider adding error tracking:

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  // Sentry options
});
```

### Logging

For production logging, consider:

- **Vercel**: Built-in function logs
- **Firebase**: Cloud Functions logs
- **Custom**: Winston, Pino, or similar

---

## Backup & Recovery

### Firestore Backups

1. **Enable Scheduled Backups**
   - Go to Firebase Console → Firestore → Backups
   - Configure daily backup schedule
   - Select retention period (7 days recommended)

2. **Manual Export**
   ```bash
   gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
   ```

3. **Restore from Backup**
   ```bash
   gcloud firestore import gs://your-bucket/backups/20240115
   ```

### Data Export

Export tenant data for compliance or migration:

```typescript
// Example: Export all products
const snapshot = await getDocs(collection(db, `tenants/${tenantId}/products`));
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
console.log(JSON.stringify(products, null, 2));
```

---

## Updating Production

### Standard Update Process

1. **Test in Development**
   - Run all tests locally
   - Test manually in development environment

2. **Create Pull Request**
   - PR triggers preview deployment (Vercel)
   - Review preview deployment

3. **Merge to Main**
   - Automatic deployment to production
   - Monitor for errors

### Database Migrations

For schema changes:

1. **Backwards-Compatible Changes**
   - Add new fields with default values
   - Deploy code first, then update data

2. **Breaking Changes**
   - Deploy migration script
   - Update all documents
   - Deploy new code
   - Remove old field handling

Example migration script:
```typescript
// Add defaultLocationId to all global settings
const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
for (const tenant of tenantsSnapshot.docs) {
  const settingsRef = doc(db, `tenants/${tenant.id}/settings/global`);
  await updateDoc(settingsRef, {
    defaultLocationId: null,
    updatedAt: serverTimestamp()
  });
}
```

---

## Troubleshooting Production Issues

### Common Issues

1. **"Firebase app not initialized"**
   - Verify all environment variables are set
   - Check variable names match exactly (case-sensitive)

2. **"Permission denied" errors**
   - Check Firestore security rules are deployed
   - Verify user's tenant ID matches data path
   - Check user document has correct role/permissions

3. **Slow page loads**
   - Check Firestore indexes are deployed
   - Review query complexity
   - Consider pagination for large collections

4. **Authentication loop**
   - Clear browser cookies
   - Check Firebase Auth configuration
   - Verify auth domain is correct

### Checking Firebase Logs

1. **Authentication Logs**
   - Firebase Console → Authentication → Logs

2. **Firestore Logs**
   - Firebase Console → Firestore → Monitor

3. **Function Logs** (if using Cloud Functions)
   - Firebase Console → Functions → Logs

### Emergency Rollback

If a deployment causes critical issues:

**Vercel:**
- Go to Deployments
- Find the last working deployment
- Click "..." → "Promote to Production"

**Firebase Hosting:**
```bash
firebase hosting:rollback
```

---

## Security Checklist

### Pre-Launch

- [ ] Firestore security rules deployed and tested
- [ ] No sensitive data in client-side code
- [ ] Environment variables secured (not in git)
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### Ongoing

- [ ] Regular security rule audits
- [ ] Monitor for suspicious authentication activity
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Review user permissions periodically

---

## Related Documents

- [Architecture Overview](./ARCHITECTURE.md)
- [Firebase Integration](./FIREBASE.md)
- [Development Guidelines](./DEVELOPMENT.md)
- [Local Testing Guide](./LOCAL_TESTING.md)
