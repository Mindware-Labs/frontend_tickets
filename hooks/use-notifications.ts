"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface NotificationItem {
  id: number;
  type:
    | "CALLBACK_OVERDUE"
    | "CALLBACK_REMINDER"
    | "TICKET_ASSIGNED"
    | "TICKET_FOLLOWUP_OVERDUE"
    | "SCHEDULED_CALL_DUE";
  message: string;
  callId: number | null;
  ticketId: number | null;
  scheduleCallId?: number | null;
  agentId: number | null;
  read: boolean;
  createdAt: string;
  call?: {
    id: number;
    customer?: { id: number; name: string; phone?: string } | null;
    followUpAssignedTo?: { id: number; name: string } | null;
  };
  ticket?: {
    id: number;
    customer?: { id: number; name: string; phone?: string } | null;
  };
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Fetch failed");
  return json;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotifications() {
  // Unread count (polled every 60s as backup to WebSocket)
  const { data: countData, mutate: mutateCount } = useSWR(
    "/api/notifications/count",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
    },
  );

  // Full notification list (only fetched on demand when dropdown opens)
  const {
    data: listData,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR("/api/notifications?unread=true", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  const unreadCount: number = countData?.count ?? 0;
  const notifications: NotificationItem[] = listData?.data ?? [];

  // ---- Actions ----------------------------------------------------------------
  const markRead = useCallback(
    async (id: number) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      mutateCount();
      mutateList();
    },
    [mutateCount, mutateList],
  );

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    mutateCount();
    mutateList();
  }, [mutateCount, mutateList]);

  /** Call from socket event handler to revalidate caches. */
  const refresh = useCallback(() => {
    mutateCount();
    mutateList();
  }, [mutateCount, mutateList]);

  return {
    unreadCount,
    notifications,
    listLoading,
    markRead,
    markAllRead,
    refresh,
  };
}

/**
 * Globally revalidate notification caches (useful from socket provider).
 */
export function revalidateNotifications() {
  globalMutate("/api/notifications/count");
  globalMutate("/api/notifications?unread=true");
}
