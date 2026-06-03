"use client";

import { useEffect } from "react";
import { getTokenExpiresAt, redirectToLogin } from "@/lib/api-client";

/**
 * Schedules an automatic redirect to /login exactly when the JWT expires.
 * Also re-checks on tab focus so idle users aren't left with a stale session.
 */
export function TokenExpiryWatcher() {
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    function schedule() {
      clearTimeout(timerId);
      const expiresAt = getTokenExpiresAt();
      if (!expiresAt) return;

      const msUntilExpiry = expiresAt - Date.now();
      if (msUntilExpiry <= 0) {
        redirectToLogin();
        return;
      }

      timerId = setTimeout(redirectToLogin, msUntilExpiry);
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const expiresAt = getTokenExpiresAt();
      if (!expiresAt || Date.now() >= expiresAt) {
        redirectToLogin();
      } else {
        schedule();
      }
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Re-schedule when a new token is set after login
    window.addEventListener("user-role-updated", schedule);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("user-role-updated", schedule);
    };
  }, []);

  return null;
}
