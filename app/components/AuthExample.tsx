"use client";

import { useQuickAuth } from "../hooks/useQuickAuth";

/**
 * Example component demonstrating Quick Auth usage
 * 
 * This component shows how to implement authentication in your mini app.
 * You can use this as a reference or integrate the useQuickAuth hook
 * directly into your existing components.
 * 
 * @see https://docs.base.org/mini-apps/core-concepts/authentication
 */
export function AuthExample() {
  const { token, user, isLoading, error, signIn, signOut, isAuthenticated } = useQuickAuth();

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <button
          onClick={signIn}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: "#1976d2",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1565c0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1976d2";
          }}
        >
          Sign In with Quick Auth
        </button>
        {error && (
          <p style={{ marginTop: "12px", color: "#d32f2f", fontSize: 14 }}>
            Error: {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
          marginBottom: "16px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: 18, fontWeight: 600 }}>
          ✅ Authenticated
        </h3>
        <p style={{ margin: "4px 0", fontSize: 14 }}>
          <strong>FID:</strong> {user?.fid}
        </p>
        <p style={{ margin: "4px 0", fontSize: 14 }}>
          <strong>Token issued at:</strong> {user?.issuedAt ? new Date(user.issuedAt * 1000).toLocaleString() : "N/A"}
        </p>
        <p style={{ margin: "4px 0", fontSize: 14 }}>
          <strong>Token expires at:</strong> {user?.expiresAt ? new Date(user.expiresAt * 1000).toLocaleString() : "N/A"}
        </p>
        <p style={{ margin: "4px 0", fontSize: 12, color: "#666", marginTop: "8px" }}>
          Token: {token?.substring(0, 20)}...
        </p>
      </div>
      <button
        onClick={signOut}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: "#d32f2f",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#c62828";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#d32f2f";
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

