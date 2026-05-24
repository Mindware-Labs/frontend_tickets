"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CustomerOption = { id: number; name?: string | null };

export function parseSafeReturnPath(returnToParam: string | null): string | null {
  if (!returnToParam) return null;
  try {
    const decoded = decodeURIComponent(returnToParam);
    if (decoded.startsWith("/customers") || decoded.startsWith("/calls")) {
      return decoded;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildReturnBackLabel(
  safeReturnPath: string | null,
  customers: CustomerOption[],
): string | null {
  if (!safeReturnPath) return null;
  try {
    const url = new URL(safeReturnPath, "http://localhost");
    if (url.searchParams.get("timeline") === "1") {
      const customerId = url.searchParams.get("customerId");
      const match = customers.find((c) => String(c.id) === customerId);
      if (match?.name?.trim()) {
        return `Back to ${match.name.trim()} timeline`;
      }
      return "Back to customer timeline";
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

  const safeReturnPath = useMemo(
    () => parseSafeReturnPath(returnToParam),
    [returnToParam],
  );

  const returnBackLabel = useMemo(
    () => buildReturnBackLabel(safeReturnPath, customers),
    [safeReturnPath, customers],
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
