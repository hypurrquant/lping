"use client";

import { useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface AuthUser {
  fid: number;
  issuedAt: number;
  expiresAt: number;
}

interface UseQuickAuthReturn {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_ROOT_URL ||
  process.env.NEXT_PUBLIC_URL ||
  "http://localhost:3000";

/**
 * Custom hook for Quick Auth authentication
 * 
 * Provides instant authentication using Farcaster's identity system.
 * No passwords, email verification, or complex OAuth flows required.
 * 
 * @example
 * ```tsx
 * const { token, user, signIn, signOut, isAuthenticated } = useQuickAuth();
 * 
 * if (!isAuthenticated) {
 *   return <button onClick={signIn}>Sign In</button>;
 * }
 * 
 * return <div>Authenticated as FID: {user?.fid}</div>;
 * ```
 * 
 * @see https://docs.base.org/mini-apps/core-concepts/authentication
 */
export function useQuickAuth(): UseQuickAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get JWT token from Quick Auth
      const { token: authToken } = await sdk.quickAuth.getToken();
      setToken(authToken);

      // Step 2: Use the token to authenticate with backend
      // sdk.quickAuth.fetch automatically includes the Authorization header
      const response = await sdk.quickAuth.fetch(`${BACKEND_ORIGIN}/api/auth`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Authentication failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      setToken(null);
      setUser(null);
      console.error("Authentication failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  return {
    token,
    user,
    isLoading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!token && !!user,
  };
}

