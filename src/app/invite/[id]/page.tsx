"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { fetchInvitation, acceptInvitation, isInvitationExpired } from "@/lib/firestore/invitations";
import type { Invitation } from "@/lib/firestore/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const signupSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

type PageState = "loading" | "valid" | "expired" | "accepted" | "not-found" | "error" | "success";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema) as any,
    mode: "onChange",
  });

  useEffect(() => {
    async function loadInvitation() {
      try {
        const inv = await fetchInvitation(invitationId);

        if (!inv) {
          setPageState("not-found");
          return;
        }

        if (inv.status === "accepted") {
          setPageState("accepted");
          return;
        }

        if (inv.status === "revoked") {
          setPageState("not-found");
          return;
        }

        if (isInvitationExpired(inv)) {
          setPageState("expired");
          setInvitation(inv);
          return;
        }

        setInvitation(inv);
        setPageState("valid");
      } catch (error) {
        console.error("Error loading invitation:", error);
        setPageState("error");
        setErrorMessage("Failed to load invitation. Please try again.");
      }
    }

    loadInvitation();
  }, [invitationId]);

  const onSubmit = async (data: SignupFormData) => {
    if (!invitation) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        data.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Create user document in Firestore
      const userDocRef = doc(db, `tenants/${invitation.tenantId}/users`, userCredential.user.uid);
      await setDoc(userDocRef, {
        email: invitation.email,
        displayName: data.displayName,
        role: invitation.role,
        permissions: [],
        locationIds: [],
        isActive: true,
        tenantId: invitation.tenantId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Mark invitation as accepted
      await acceptInvitation(invitationId);

      setPageState("success");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating account:", error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists. Please sign in instead.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password is too weak. Please use a stronger password.");
      } else {
        setErrorMessage("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Account Created!</h1>
            <p className="mt-2 text-gray-600">
              Your account has been successfully created. Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (pageState === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Invitation Not Found</h1>
            <p className="mt-2 text-gray-600">
              This invitation link is invalid or has been revoked.
            </p>
            <Button className="mt-6" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  if (pageState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Invitation Expired</h1>
            <p className="mt-2 text-gray-600">
              This invitation has expired. Please contact your administrator to request a new invitation.
            </p>
            <Button className="mt-6" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already accepted state
  if (pageState === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-blue-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Already Accepted</h1>
            <p className="mt-2 text-gray-600">
              This invitation has already been accepted. Please sign in with your account.
            </p>
            <Button className="mt-6" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Something Went Wrong</h1>
            <p className="mt-2 text-gray-600">{errorMessage}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Valid invitation - show signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-white">Welcome!</h1>
            <p className="mt-2 text-indigo-100">
              You&apos;ve been invited to join as a{" "}
              <span className="font-semibold capitalize">{invitation?.role}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name *</Label>
              <Input
                id="displayName"
                type="text"
                {...register("displayName")}
                placeholder="John Doe"
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
