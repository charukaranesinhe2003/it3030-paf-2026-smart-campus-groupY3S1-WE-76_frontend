"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: restrict to specific roles e.g. ["ROLE_ADMIN"] */
  requiredRoles?: string[];
}

/**
 * Wraps a page or section that requires authentication.
 *
 * Usage — protect any page:
 *   <ProtectedRoute>
 *     <MyPage />
 *   </ProtectedRoute>
 *
 * Usage — restrict to admins:
 *   <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 * RBAC note: this component hides UI for UX only.
 * Real enforcement is done by @PreAuthorize on the backend.
 */
export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) =>
        user?.roles.includes(role)
      );
      if (!hasRole) {
        // Authenticated but wrong role — redirect to home
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, requiredRoles, router]);

  // Don't render children until auth is confirmed
  if (!isAuthenticated) return null;

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => user?.roles.includes(role));
    if (!hasRole) return null;
  }

  return <>{children}</>;
}
