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
 *     --role="admin"
 *
 * Arguments:
 *   --email     User's email address (required)
 *   --password  User's password (min 6 characters, required)
 *   --tenant    Tenant ID to associate with (default: tenant_demo)
 *   --role      User role: admin, manager, or cashier (default: cashier)
 *   --name      Display name (optional)
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

    // Step 2: Create/update user profile in Firestore
    console.log('2️⃣  Creating Firestore user profile...');
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      email,
      displayName,
      tenantId,
      role,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('   ✅ Created user profile at users/' + userRecord.uid);

    // Step 3: Add user to tenant members collection
    console.log('3️⃣  Adding user to tenant members...');
    const memberRef = db.collection('tenants').doc(tenantId).collection('members').doc(userRecord.uid);
    await memberRef.set({
      role,
      joinedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`   ✅ Added to tenants/${tenantId}/members/${userRecord.uid}`);

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
