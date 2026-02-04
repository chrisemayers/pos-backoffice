# Local Testing Guide

This guide covers how to test the POS Back Office application locally.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project configured (see [FIREBASE.md](./FIREBASE.md))

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd POS_Backoffice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Tenant ID (for multi-tenant support)
   NEXT_PUBLIC_TENANT_ID=tenant_demo
   ```

## Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### End-to-End Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## Testing Different Scenarios

### Authentication Testing

1. **Valid Login**: Use a test account created in Firebase Console
2. **Invalid Login**: Use incorrect credentials to test error handling
3. **Protected Routes**: Try accessing `/inventory` without logging in

### Inventory Testing

1. Navigate to `/inventory`
2. Test creating a new product
3. Test editing an existing product
4. Test archiving and restoring products
5. Test search and filters

### Sales History Testing

1. Navigate to `/sales`
2. Test date range filters
3. Test payment type filters
4. Test receipt ID search
5. Click on a sale to view details

### Reports Testing

1. Navigate to `/reports`
2. Change time periods (This Week, This Month, etc.)
3. Verify charts render correctly
4. Check period comparison data

### Settings Testing

1. Navigate to `/settings`
2. Test updating business information
3. Test enabling/disabling tax
4. Test payment method selection
5. Test default location selection (see below)

### RBAC / Permissions Testing

The application has three user roles with different permissions. Create test users for each role.

#### Setting Up Test Users

1. **Create Admin User** (if not already done - see [DEVELOPMENT.md](./DEVELOPMENT.md))
2. **Create Manager User**: Via admin account → Employees → Add Employee → Role: Manager
3. **Create Cashier User**: Via admin account → Employees → Add Employee → Role: Cashier

#### Testing Admin Role

Admins should have full access to all features:

1. ✅ Can view/create/edit/delete products (Inventory)
2. ✅ Can view/void/refund sales (Sales)
3. ✅ Can view/export reports (Reports)
4. ✅ Can view/edit settings (Settings)
5. ✅ Can view/create/edit/delete users (Employees)
6. ✅ Can view/create/edit/delete locations (Locations)

#### Testing Manager Role

Managers have limited access:

1. ✅ Can view/create/edit/delete products (Inventory) - full inventory access
2. ✅ Can view/void/refund sales (Sales) - full sales access
3. ✅ Can view/export reports (Reports) - full reports access
4. ✅ Can view settings (Settings)
5. ❌ Cannot edit settings
6. ✅ Can view users (Employees)
7. ❌ Cannot create/edit/delete users
8. ✅ Can view locations
9. ❌ Cannot create/edit/delete locations

#### Testing Cashier Role

Cashiers have minimal access:

1. ✅ Can view products only (Inventory)
2. ❌ Cannot create/edit/delete products
3. ✅ Can view sales only (Sales)
4. ❌ Cannot void/refund sales
5. ✅ Can view reports only (Reports)
6. ❌ Cannot export reports
7. ❌ Cannot access Settings, Employees, or Locations pages

#### Permission UI Verification

For each role, verify:

- [ ] Navigation sidebar only shows accessible menu items
- [ ] "Add" buttons are hidden when user lacks create permission
- [ ] Edit/Delete actions in tables are hidden when user lacks permissions
- [ ] Attempting to access a restricted URL directly shows "Access Denied" message
- [ ] No console errors related to permission checks

### Location Management Testing

1. **Create Location** (as admin):
   - Navigate to `/locations`
   - Click "Add Location"
   - Fill in: Name, Address, Timezone, Currency
   - Save and verify it appears in the list

2. **Edit Location**:
   - Click the edit button on a location
   - Modify fields and save
   - Verify changes are reflected

3. **Deactivate Location**:
   - Click the menu (⋮) on a location row
   - Select "Deactivate"
   - Verify location is marked as inactive (grayed out or removed from active list)

4. **Set Default Location** (for receipts):
   - Navigate to `/settings`
   - Find "Default Location" section
   - Select a location from the dropdown
   - Verify the preview shows the location's name and address
   - Save settings

5. **Clear Default Location**:
   - Navigate to `/settings`
   - Click "Clear Selection" or select "None"
   - Verify it falls back to business info

### Default Location for Receipts Testing

This feature allows receipts to display a specific store location instead of the generic business info.

#### Setting Up

1. **Create at least one location** with name and address
2. **Set as default location** in Settings → Default Location

#### Verify in Back Office

1. Navigate to Settings
2. Select a location from the Default Location dropdown
3. Verify the preview shows:
   - Location name (e.g., "Downtown Store")
   - Location address (e.g., "123 Main St, City, ST 12345")
   - Timezone and currency of the location

#### Verify in Android App

After setting default location in Back Office:

1. Make a test sale in the Android POS app
2. View the receipt screen
3. Verify the receipt header shows:
   - **With default location**: Location name and address
   - **Without default location**: Business name and address (from Settings)

4. Generate PDF receipt
5. Verify PDF header matches the receipt screen

#### Fallback Behavior

Test the fallback when no default location is set:

1. Clear the default location in Settings (set to "None")
2. Create a test sale in Android app
3. Verify receipt shows business name and address instead

### Settings Sync Testing

The Back Office and Android app share settings via Firestore. Test the sync flow:

#### Global Settings (Back Office → Android)

1. **Update Business Info** in Back Office Settings:
   - Change business name, phone, or website
   - Save changes

2. **Verify in Android App**:
   - Force-sync or wait for real-time update
   - Check Settings screen shows new values
   - Create a receipt and verify header reflects changes

3. **Test Tax Settings**:
   - Enable/disable tax in Back Office
   - Change tax rate
   - Verify Android receipts calculate tax correctly

4. **Test Payment Methods**:
   - Enable/disable payment methods (Cash, Card, Digital)
   - Verify Android checkout shows only enabled methods

5. **Test Default Location**:
   - Set a default location in Back Office
   - Verify Android receipt shows location info

#### App Settings (Android → Back Office)

1. **Update Printer Settings** in Android app
2. **Verify in Back Office** Settings page shows the updated values (read-only)
3. Note: Back Office cannot modify App settings

### Cross-Platform Testing Scenarios

| Scenario | Back Office Action | Android Verification |
|----------|-------------------|---------------------|
| Tax rate change | Settings → Tax Rate → 8.5% | Receipt shows 8.5% tax |
| New location | Locations → Add "Mall Kiosk" | (Not visible - no location sync) |
| Default location | Settings → Default Location → "Mall Kiosk" | Receipt header shows "Mall Kiosk" |
| Disable card payment | Settings → Payment Methods → Card OFF | Card option hidden in checkout |
| Business phone change | Settings → Business Phone → New number | Receipt shows new phone |

## Firebase Emulator (Optional)

For isolated local testing without affecting production data:

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize emulators**
   ```bash
   firebase init emulators
   ```
   Select: Authentication, Firestore

3. **Start emulators**
   ```bash
   firebase emulators:start
   ```

4. **Update `.env.local`** to use emulators:
   ```env
   NEXT_PUBLIC_USE_EMULATOR=true
   ```

## Troubleshooting

### Common Issues

1. **"Firebase app not initialized"**
   - Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`
   - Restart the dev server after changing env variables

2. **"Permission denied" from Firestore**
   - Check Firebase security rules
   - Verify the user is authenticated
   - Check the tenant ID matches your data structure

3. **Tests failing with "document is not defined"**
   - Ensure `jsdom` environment is configured in `vitest.config.ts`

4. **Playwright tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Check that the dev server is running
   - Verify test selectors are correct

### Debug Mode

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

## Code Coverage

After running `npm run test:coverage`, view the coverage report:
```bash
open coverage/index.html
```

Target coverage thresholds:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%
