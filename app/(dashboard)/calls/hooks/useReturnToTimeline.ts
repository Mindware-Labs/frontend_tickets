"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CustomerOption = { id: number; name?: string | null };

/**
 * Whitelist of route prefixes the return-bar is allowed to navigate back to.
 * Prevents arbitrary `returnTo=...` URLs (open redirect avoidance) while
 * supporting:
 *   - `/customers` — customer timeline / customer list
 *   - `/calls`     — calls/tickets/manual-records dashboard
 *   - `/reports/yards` — yard report sheets (e.g. High & Emergency)
 */
const ALLOWED_RETURN_PREFIXES = [
  "/customers",
  "/calls",
  "/reports/yards",
] as const;

export function parseSafeReturnPath(returnToParam: string | null): string | null {
  if (!returnToParam) return null;
  try {
    const decoded = decodeURIComponent(returnToParam);
    if (ALLOWED_RETURN_PREFIXES.some((prefix) => decoded.startsWith(prefix))) {
      return decoded;
    }
  } catch {
    return null;
  }
  return null;
}

type ReturnLabelContext = {
  fromReport?: string | null;
  reportYardName?: string | null;
  reportSection?: string | null;
};

export function buildReturnBackLabel(
  safeReturnPath: string | null,
  customers: CustomerOption[],
  context: ReturnLabelContext = {},
): string | null {
  if (!safeReturnPath) return null;
  try {
    const url = new URL(safeReturnPath, "http://localhost");

    // Customer timeline (existing behavior)
    if (url.searchParams.get("timeline") === "1") {
      const customerId = url.searchParams.get("customerId");
      const match = customers.find((c) => String(c.id) === customerId);
      if (match?.name?.trim()) {
        return `Back to ${match.name.trim()} timeline`;
      }
      return "Back to customer timeline";
    }

    // Yard report return paths
    if (url.pathname.startsWith("/reports/yards")) {
      const { fromReport, reportYardName, reportSection } = context;
      const yardLabel = reportYardName?.trim();
      if (fromReport === "highPriorityPending") {
        const sectionLabel =
          reportSection === "closed" ? "Closed / Resolved" : "Pending";
        if (yardLabel) {
          return `Back to ${yardLabel} High Priority (${sectionLabel})`;
        }
        return `Back to High Priority report (${sectionLabel})`;
      }
      if (fromReport === "openWorkload") {
        if (yardLabel) {
          return `Back to ${yardLabel} Open Workload`;
        }
        return "Back to Open Workload report";
      }
      if (yardLabel) {
        return `Back to ${yardLabel} report`;
      }
      return "Back to yard report";
    }

    // Generic fallthrough for any other /reports/* path we may add later
    if (url.pathname.startsWith("/reports")) {
      return "Back to report";
    }

    return "Back to customers";
  } catch {
    return "Back to previous page";
  }
}

export function useReturnToTimeline(customers: CustomerOption[] = []) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get("returnTo");
  const fromReport = searchParams.get("fromReport");
  const reportYardName = searchParams.get("reportYardName");
  const reportSection = searchParams.get("reportSection");

  const safeReturnPath = useMemo(
    () => parseSafeReturnPath(returnToParam),
    [returnToParam],
  );

  const returnBackLabel = useMemo(
    () =>
      buildReturnBackLabel(safeReturnPath, customers, {
        fromReport,
        reportYardName,
        reportSection,
      }),
    [safeReturnPath, customers, fromReport, reportYardName, reportSection],
  );

  const leaveToTimeline = useCallback(() => {
    if (!safeReturnPath) return false;
    router.replace(safeReturnPath, { scroll: false });
    return true;
  }, [router, safeReturnPath]);

  return {
    safeReturnPath,
    returnBackLabel,
    returnToParam,
    leaveToTimeline,
  };
}

export function buildTabUrlWithoutDeepLink(
  searchParams: URLSearchParams,
  tab: "calls" | "tickets" | "manual-records",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("id");
  params.delete("returnTo");
  if (tab === "calls") {
    params.delete("tab");
  } else {
    params.set("tab", tab);
  }
  const qs = params.toString();
  if (tab === "calls") {
    return qs ? `/calls?${qs}` : "/calls";
  }
  return qs ? `/calls?${qs}` : `/calls?tab=${tab}`;
}
