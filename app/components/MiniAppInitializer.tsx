"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

/**
 * MiniApp Initializer Component
 * Calls sdk.actions.ready() to hide the loading splash screen and display the app
 * Required for Base Mini Apps migration
 * @see https://docs.base.org/mini-apps/quickstart/migrate-existing-apps
 */
export function MiniAppInitializer() {
  useEffect(() => {
    // Call ready() once the app has loaded to hide the loading splash screen
    sdk.actions.ready().catch((error) => {
      // Only log error if SDK is available (not in regular browser)
      if (typeof window !== "undefined" && window.location.protocol !== "file:") {
        console.warn("MiniApp SDK ready() failed (expected in non-MiniApp contexts):", error);
      }
    });
  }, []);

  return null;
}

