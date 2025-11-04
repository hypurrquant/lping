"use client";

import { useEffect } from "react";

/**
 * Forces English locale for Coinbase SDK compatibility
 * This runs immediately on mount to override navigator.language before SDK loads
 */
export function LocaleFix() {
  useEffect(() => {
    // Override navigator.language immediately to prevent Coinbase SDK errors
    if (typeof window !== "undefined" && navigator.language?.startsWith("ko")) {
      try {
        Object.defineProperty(navigator, "language", {
          get: () => "en-US",
          configurable: true,
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
          configurable: true,
        });
      } catch (e) {
        // Fallback if defineProperty fails
        console.warn("Failed to override navigator.language:", e);
      }
    }
  }, []);

  return null;
}

