#!/usr/bin/env node
/**
 * Bootstrap User Script
 *
 * Creates a test user in Firebase Auth and sets up their Firestore profile
 * with tenant association. Users created by this script can log into both
 * POS_App (Android) and POS_Backoffice (Web).
 *
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Set up a service account:
 *    - Go to Firebase Console > Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as "service-account.json" in the scripts/ directory
 *    - Add "scripts/service-account.json" to .gitignore
 *
 * Usage:
 *   node scripts/bootstrap-user.mjs \
 *     --email="user@example.com" \
 *     --password="securepassword" \
 *     --tenant="tenant_demo" \
 *     --role="admin" \
 *     --location="location_id"
 *
 * Arguments:
 *   --email     User's email address (required)
 *   --password  User's password (min 6 characters, required)
 *   --tenant    Tenant ID to associate with (default: tenant_demo)
 *   --role      User role: admin, manager, or cashier (default: cashier)
 *   --name      Display name (optional)
 *   --location  Default location ID for POS app (optional, falls back to tenant settings)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

// Validate arguments
function validateArgs(args) {
  if (!args.email) {
    console.error('Error: --email is required');
    process.exit(1);
  }
  if (!args.password) {
    console.error('Error: --password is required');
    process.exit(1);
  }
  if (args.password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
  }
  if (args.role && !['admin', 'manager', 'cashier'].includes(args.role)) {
    console.error('Error: --role must be admin, manager, or cashier');
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs();
  validateArgs(args);

  const email = args.email;
  const password = args.password;
  const tenantId = args.tenant || 'tenant_demo';
  const role = args.role || 'cashier';
  const displayName = args.name || email.split('@')[0];
  const defaultLocationId = args.location || null;

  // Check for service account file
  const serviceAccountPath = join(__dirname, 'service-account.json');
  if (!existsSync(serviceAccountPath)) {
    console.error('\nError: Service account file not found.');
    console.error('Please create scripts/service-account.json:');
    console.error('  1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('  2. Click "Generate new private key"');
    console.error('  3. Save the file as scripts/service-account.json');
    console.error('\nIMPORTANT: Add scripts/service-account.json to .gitignore!\n');
    process.exit(1);
  }

  // Initialize Firebase Admin
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const auth = getAuth();
  const db = getFirestore();

  console.log('\n🚀 Bootstrap User Script');
  console.log('========================\n');
  console.log(`Email:    ${email}`);
  console.log(`Tenant:   ${tenantId}`);
  console.log(`Role:     ${role}`);
  console.log(`Name:     ${displayName}`);
  console.log(`Location: ${defaultLocationId || '(uses tenant default)'}`);
  console.log('');

  try {
    // Step 1: Create user in Firebase Auth
    console.log('1️⃣  Creating Firebase Auth user...');
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true // Skip email verification for test users
      });
      console.log(`   ✅ Created user with UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('   ⚠️  User already exists, fetching existing user...');
        userRecord = await auth.getUserByEmail(email);
        console.log(`   ✅ Found existing user with UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create/update user profile in tenant's users collection
    // This is where the web app looks for users (tenants/{tenantId}/users)
    console.log('2️⃣  Creating Firestore user profile in tenant...');

    // Define permissions based on role
    const PERMISSIONS = {
      INVENTORY_VIEW: "inventory:view",
      INVENTORY_CREATE: "inventory:create",
      INVENTORY_EDIT: "inventory:edit",
      INVENTORY_DELETE: "inventory:delete",
      SALES_VIEW: "sales:view",
      SALES_VOID: "sales:void",
      SALES_REFUND: "sales:refund",
      REPORTS_VIEW: "reports:view",
      REPORTS_EXPORT: "reports:export",
      SETTINGS_VIEW: "settings:view",
      SETTINGS_EDIT: "settings:edit",
      USERS_VIEW: "users:view",
      USERS_CREATE: "users:create",
      USERS_EDIT: "users:edit",
      USERS_DELETE: "users:delete",
      LOCATIONS_VIEW: "locations:view",
      LOCATIONS_CREATE: "locations:create",
      LOCATIONS_EDIT: "locations:edit",
      LOCATIONS_DELETE: "locations:delete",
    };

    const DEFAULT_ROLE_PERMISSIONS = {
      admin: Object.values(PERMISSIONS),
      manager: [
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.INVENTORY_EDIT,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_VOID,
        PERMISSIONS.SALES_REFUND,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.LOCATIONS_VIEW,
      ],
      cashier: [
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.REPORTS_VIEW,
      ],
    };

    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

    // Create in tenant's users collection (where the web app looks)
    const tenantUserRef = db.collection('tenants').doc(tenantId).collection('users').doc(userRecord.uid);
    const tenantUserData = {
      email,
      displayName,
      tenantId,
      role,
      permissions,
      locationIds: defaultLocationId ? [defaultLocationId] : [],
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    // Only include defaultLocationId if provided
    if (defaultLocationId) {
      tenantUserData.defaultLocationId = defaultLocationId;
    }
    await tenantUserRef.set(tenantUserData, { merge: true });
    console.log(`   ✅ Created user profile at tenants/${tenantId}/users/${userRecord.uid}`);

    // Step 3: Also create in root users collection (for Android app)
    console.log('3️⃣  Creating root user profile (Android app)...');
    const rootUserRef = db.collection('users').doc(userRecord.uid);
    const rootUserData = {
      email,
      displayName,
      tenantId,
      role,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    // Only include defaultLocationId if provided
    if (defaultLocationId) {
      rootUserData.defaultLocationId = defaultLocationId;
    }
    await rootUserRef.set(rootUserData, { merge: true });
    console.log(`   ✅ Created user profile at users/${userRecord.uid}`);

    // Step 4: Ensure tenant document exists
    console.log('4️⃣  Ensuring tenant document exists...');
    const tenantRef = db.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();
    if (!tenantDoc.exists) {
      await tenantRef.set({
        name: tenantId.replace('tenant_', '').replace(/_/g, ' '),
        plan: 'free',
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`   ✅ Created tenant document: tenants/${tenantId}`);
    } else {
      console.log(`   ✅ Tenant document already exists: tenants/${tenantId}`);
    }

    console.log('\n✨ Success! User is ready to login.\n');
    console.log('📱 Android App: Use email/password to sign in');
    console.log('💻 Web App: Navigate to /login and use email/password\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  }
}

main().catch(console.error);
