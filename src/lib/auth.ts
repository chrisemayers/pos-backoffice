import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

// Ensure user document exists in Firestore with tenant assignment
async function ensureUserDocument(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);

  try {
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document with default tenant
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        tenantId: DEFAULT_TENANT_ID,
        role: "admin", // Default role for new users
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      console.log("[Auth] Created user document for", user.email);
    } else {
      // Update last login
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      console.log("[Auth] Updated last login for", user.email);
    }
  } catch (error) {
    console.warn("[Auth] Could not create/update user document:", error);
    // Don't throw - allow login to proceed even if user doc creation fails
  }
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(result.user);
  return result.user;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await ensureUserDocument(result.user);
  return result.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Auth error messages
export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/invalid-email": "Invalid email address",
    "auth/user-disabled": "This account has been disabled",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/network-request-failed": "Network error. Check your connection",
    "auth/popup-closed-by-user": "Sign-in popup was closed",
  };
  return messages[code] || "An error occurred. Please try again";
}
