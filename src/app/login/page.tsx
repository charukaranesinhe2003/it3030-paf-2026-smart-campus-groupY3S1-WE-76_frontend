"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { loginWithGoogle } from "@/services/authService";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * Login page — /login
 *
 * Shows a Google Sign-In button. On success:
 *   1. Sends the Google credential to POST /api/auth/google
 *   2. Stores the returned JWT via AuthContext.login()
 *   3. Redirects to the home page
 */
export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  // Already logged in — skip the login page
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      alert("Google sign-in did not return a credential. Please try again.");
      return;
    }

    try {
      const authResponse = await loginWithGoogle(credentialResponse.credential);
      login(authResponse.token);
      router.replace("/");
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const message =
        error instanceof Error ? error.message : "Login failed. Please try again.";
      alert(message);
    }
  };

  const handleError = () => {
    alert("Google sign-in failed. Please try again.");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md border border-gray-200">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800">Smart Campus</h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage bookings and resources
            </p>
          </div>

          {/* Google Sign-In button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap={false}
              shape="rectangular"
              theme="outline"
              size="large"
              text="signin_with"
              locale="en"
            />
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in you agree to the Smart Campus terms of use.
          </p>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
