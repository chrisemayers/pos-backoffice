import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "./firebase";

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
    } else {
      // Update last login
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch {
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

// Update user display name
export async function updateUserDisplayName(displayName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  await updateProfile(user, { displayName });

  // Also update Firestore user document
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, { displayName }, { merge: true });
}

// Upload and update user profile photo
export async function updateUserPhoto(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  // Delete old photo if exists
  if (user.photoURL?.includes("firebasestorage")) {
    try {
      const oldPhotoRef = ref(storage, `profile-photos/${user.uid}`);
      await deleteObject(oldPhotoRef);
    } catch {
      // Ignore if old photo doesn't exist
    }
  }

  // Upload new photo
  const photoRef = ref(storage, `profile-photos/${user.uid}`);
  await uploadBytes(photoRef, file);
  const photoURL = await getDownloadURL(photoRef);

  // Update Firebase Auth profile
  await updateProfile(user, { photoURL });

  // Also update Firestore user document
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, { photoURL }, { merge: true });

  return photoURL;
}

// Remove user profile photo
export async function removeUserPhoto(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  // Delete photo from storage if it's our storage
  if (user.photoURL?.includes("firebasestorage")) {
    try {
      const photoRef = ref(storage, `profile-photos/${user.uid}`);
      await deleteObject(photoRef);
    } catch {
      // Ignore if photo doesn't exist
    }
  }

  // Update Firebase Auth profile
  await updateProfile(user, { photoURL: null });

  // Also update Firestore user document
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, { photoURL: null }, { merge: true });
}
