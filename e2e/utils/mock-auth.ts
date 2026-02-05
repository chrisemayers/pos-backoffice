import { Page } from "@playwright/test";

// Mock user data for testing
export const mockUser = {
  uid: "test-user-uid-123",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: true,
  isAnonymous: false,
  photoURL: null,
  providerId: "firebase",
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  tenantId: "tenant_demo",
};

// Firebase auth persistence key
const FIREBASE_AUTH_KEY = "firebase:authUser:";

/**
 * Injects mock authentication state into the page.
 * This bypasses Firebase auth by setting up the expected localStorage state
 * and mocking the Zustand store initialization.
 */
export async function injectMockAuth(page: Page): Promise<void> {
  // Wait for page to be ready
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Inject mock auth state via script evaluation
  await page.evaluate((user) => {
    // Create a mock Firebase user structure
    const mockFirebaseUser = {
      ...user,
      getIdToken: () => Promise.resolve("mock-id-token"),
      getIdTokenResult: () =>
        Promise.resolve({
          token: "mock-id-token",
          claims: { email: user.email },
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
        }),
      reload: () => Promise.resolve(),
      toJSON: () => user,
    };

    // Store in localStorage with Firebase's expected key pattern
    // Firebase uses: firebase:authUser:<apiKey>:<appName>
    const authKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("firebase:authUser:")
    );

    // If there's an existing key pattern, use it; otherwise create one
    const authKey = authKeys[0] || "firebase:authUser:mock-api-key:[DEFAULT]";
    localStorage.setItem(authKey, JSON.stringify(mockFirebaseUser));

    // Also set a flag that our test code can check
    localStorage.setItem("e2e-mock-auth", "true");
    localStorage.setItem("e2e-mock-user", JSON.stringify(user));
  }, mockUser);
}

/**
 * Sets up route interception to mock Firebase API responses.
 * This handles the actual Firebase REST API calls.
 */
export async function setupFirebaseMocks(page: Page): Promise<void> {
  // Mock Firebase Auth token verification
  await page.route("**/identitytoolkit.googleapis.com/**", async (route) => {
    const url = route.request().url();

    if (url.includes("verifyPassword") || url.includes("signInWithPassword")) {
      // Mock successful login response
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#VerifyPasswordResponse",
          localId: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          idToken: "mock-id-token",
          registered: true,
          refreshToken: "mock-refresh-token",
          expiresIn: "3600",
        }),
      });
    } else if (url.includes("token")) {
      // Mock token refresh
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          expires_in: "3600",
          token_type: "Bearer",
          refresh_token: "mock-refresh-token",
          id_token: "mock-id-token",
          user_id: mockUser.uid,
          project_id: "mock-project",
        }),
      });
    } else if (url.includes("getAccountInfo")) {
      // Mock account info
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "identitytoolkit#GetAccountInfoResponse",
          users: [
            {
              localId: mockUser.uid,
              email: mockUser.email,
              displayName: mockUser.displayName,
              emailVerified: true,
              providerUserInfo: [],
              validSince: Math.floor(Date.now() / 1000).toString(),
              lastLoginAt: Date.now().toString(),
              createdAt: Date.now().toString(),
            },
          ],
        }),
      });
    } else {
      // Let other Firebase requests through or mock as needed
      await route.continue();
    }
  });

  // Mock Firestore user document fetch
  await page.route("**/firestore.googleapis.com/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/users/")) {
      // Mock user document
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: `projects/mock-project/databases/(default)/documents/users/${mockUser.uid}`,
          fields: {
            email: { stringValue: mockUser.email },
            displayName: { stringValue: mockUser.displayName },
            tenantId: { stringValue: mockUser.tenantId },
            role: { stringValue: "admin" },
            isActive: { booleanValue: true },
          },
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Performs a mock login by setting up state and navigating.
 * This simulates successful authentication without hitting Firebase.
 */
export async function performMockLogin(page: Page): Promise<void> {
  // Set up Firebase API mocks
  await setupFirebaseMocks(page);

  // Navigate to login and inject mock state
  await page.goto("/login");

  // Wait for the page to load
  await page.waitForLoadState("networkidle");

  // Inject mock auth state directly into the window/app context
  await page.evaluate((user) => {
    // Set mock auth in localStorage for Firebase persistence
    const mockAuthData = {
      uid: user.uid,
      email: user.email,
      emailVerified: true,
      displayName: user.displayName,
      isAnonymous: false,
      providerData: [
        {
          providerId: "password",
          uid: user.email,
          displayName: user.displayName,
          email: user.email,
        },
      ],
      stsTokenManager: {
        refreshToken: "mock-refresh-token",
        accessToken: "mock-access-token",
        expirationTime: Date.now() + 3600000,
      },
      createdAt: Date.now().toString(),
      lastLoginAt: Date.now().toString(),
      apiKey: "mock-api-key",
      appName: "[DEFAULT]",
    };

    // Find Firebase auth key or create one
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("firebase:authUser:")) {
        localStorage.setItem(key, JSON.stringify(mockAuthData));
        break;
      }
    }

    // Fallback: set with a default key pattern
    localStorage.setItem(
      "firebase:authUser:mock-api-key:[DEFAULT]",
      JSON.stringify(mockAuthData)
    );
  }, mockUser);

  // Reload to pick up the auth state
  await page.reload();

  // Wait for auth to initialize and redirect
  await page.waitForURL("/", { timeout: 10000 }).catch(() => {
    // If redirect doesn't happen, we may need to navigate manually
  });
}
