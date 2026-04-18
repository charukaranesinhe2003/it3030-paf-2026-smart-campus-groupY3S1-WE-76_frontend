"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { AuthUser, JwtPayload } from "@/types/auth";

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** True when a valid, non-expired JWT is present in localStorage */
  isAuthenticated: boolean;
  /** Decoded user info from the JWT, or null when not authenticated */
  user: AuthUser | null;
  /**
   * Call after a successful POST /api/auth/google.
   * Stores the token and updates context state.
   */
  login: (token: string) => void;
  /** Clears the token and resets context state */
  logout: () => void;
}

// ── Context creation ──────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  /** Decode a JWT string and return an AuthUser, or null if invalid/expired */
  const decodeToken = useCallback((token: string): AuthUser | null => {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      // Check expiry (exp is in seconds, Date.now() in ms)
      if (payload.exp * 1000 < Date.now()) {
        return null;
      }
      return {
        userId: Number(payload.sub),
        email:  payload.email,
        roles:  payload.roles ?? [],
      };
    } catch {
      return null;
    }
  }, []);

  // On mount — restore session from localStorage if token is still valid
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        // Token present but expired — clean up
        localStorage.removeItem("token");
      }
    }
  }, [decodeToken]);

  const login = useCallback(
    (token: string) => {
      const decoded = decodeToken(token);
      if (!decoded) {
        throw new Error("Received an invalid or expired token from the server");
      }
      localStorage.setItem("token", token);
      setUser(decoded);
    },
    [decodeToken]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      user,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access auth state from any client component:
 *
 *   const { isAuthenticated, user, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
