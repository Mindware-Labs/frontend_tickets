"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { auth } from "@/lib/auth";
import { revalidateNotifications } from "@/hooks/use-notifications";

// -- Live call context --------------------------------------------------------
export type DashboardRealtimeEventType =
  | "ticket-assigned"
  | "tickets-updated"
  | "live-call-changed"
  | "aircall-wallboard-changed"
  | "sms-message-changed"
  | "callback-due"
  | "ticket-follow-up-due";

export type DashboardRealtimeEvent = {
  type: DashboardRealtimeEventType;
  timestamp: string;
};

type DashboardRealtimeState = {
  connected: boolean;
  version: number;
  lastEvent: DashboardRealtimeEvent | null;
};

interface LiveCallsContextValue {
  liveCallIds: Set<number>;
  dashboardRealtime: DashboardRealtimeState;
}

const LiveCallsContext = createContext<LiveCallsContextValue>({
  liveCallIds: new Set(),
  dashboardRealtime: {
    connected: false,
    version: 0,
    lastEvent: null,
  },
});

export function useLiveCalls() {
  return useContext(LiveCallsContext);
}

export function useDashboardRealtime() {
  return useContext(LiveCallsContext).dashboardRealtime;
}

// -- Provider -----------------------------------------------------------------
export function CallSocketProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [liveCallIds, setLiveCallIds] = useState<Set<number>>(new Set());
  const [dashboardRealtime, setDashboardRealtime] =
    useState<DashboardRealtimeState>({
      connected: false,
      version: 0,
      lastEvent: null,
    });
  const { toast } = useToast();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const user = auth.getUser();

  const socketRef = useRef<Socket | null>(null);
  const revalidateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const dashboardRevalidateDebounceRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    if (socketRef.current?.connected) {
      return;
    }

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const socket = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Debounced so that bursts of events collapse into one re-fetch
    const revalidateCallCaches = () => {
      if (revalidateDebounceRef.current)
        clearTimeout(revalidateDebounceRef.current);
      revalidateDebounceRef.current = setTimeout(() => {
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/calls"),
        );
      }, 300);
    };

    const revalidateDashboardCaches = () => {
      if (dashboardRevalidateDebounceRef.current) {
        clearTimeout(dashboardRevalidateDebounceRef.current);
      }
      dashboardRevalidateDebounceRef.current = setTimeout(() => {
        mutate(
          (key) =>
            typeof key === "string" &&
            (key.startsWith("/api/dashboard") ||
              key.startsWith("/api/reports") ||
              key.startsWith("/api/aircall-analytics")),
        );
      }, 300);
    };

    const markDashboardRealtime = (
      type: DashboardRealtimeEventType,
      timestamp = new Date().toISOString(),
    ) => {
      setDashboardRealtime((prev) => ({
        connected: socket.connected,
        version: prev.version + 1,
        lastEvent: { type, timestamp },
      }));
      revalidateDashboardCaches();
    };

    socket.on("connect", () => {
      setDashboardRealtime((prev) => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setDashboardRealtime((prev) => ({ ...prev, connected: false }));
    });

    socket.on(
      "ticketAssigned",
      (data: { title: string; message: string; ticketId: number }) => {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});
        } catch (e) {}

        toast({
          title: data.title,
          description: data.message,
          duration: 8000,
          action: (
            <ToastAction
              altText="Ver"
              onClick={() =>
                router.push(`/calls?view=assigned_me&id=${data.ticketId}`)
              }
            >
              View Call
            </ToastAction>
          ),
        });

        markDashboardRealtime("ticket-assigned");
        revalidateCallCaches();
      },
    );

    socket.on(
      "ticketsUpdated",
      (data: { action: string; ticketId: number; timestamp: string }) => {
        markDashboardRealtime("tickets-updated", data.timestamp);
        revalidateCallCaches();
      },
    );

    // Track live call status in real-time via WebSocket
    socket.on(
      "liveCallChanged",
      (data: { callId: number; isLive: boolean; timestamp: string }) => {
        setLiveCallIds((prev) => {
          const next = new Set(prev);
          if (data.isLive) {
            next.add(data.callId);
          } else {
            next.delete(data.callId);
          }
          return next;
        });
        markDashboardRealtime("live-call-changed", data.timestamp);
        revalidateCallCaches();
      },
    );

    socket.on(
      "aircallWallboardChanged",
      (data: { timestamp: string }) => {
        markDashboardRealtime("aircall-wallboard-changed", data.timestamp);
      },
    );

    socket.on(
      "smsMessageChanged",
      (data: { smsMessageId: number; direction: string; timestamp: string }) => {
        markDashboardRealtime("sms-message-changed", data.timestamp);
      },
    );

    socket.on(
      "callbackDue",
      (data: {
        id: number;
        type: string;
        message: string;
        callId: number;
        agentId: number | null;
        createdAt: string;
      }) => {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});
        } catch (e) {}

        toast({
          title: "⏰ Callback Overdue",
          description: data.message,
          duration: 10000,
          variant: "destructive",
          action: (
            <ToastAction
              altText="View"
              onClick={() => router.push(`/calls?id=${data.callId}`)}
            >
              View Call
            </ToastAction>
          ),
        });

        revalidateNotifications();
        markDashboardRealtime("callback-due", data.createdAt);
        revalidateCallCaches();
      },
    );

    socket.on(
      "ticketFollowUpDue",
      (data: {
        id: number;
        type: string;
        message: string;
        ticketId: number;
        agentId: number | null;
        createdAt: string;
      }) => {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});
        } catch (e) {}

        toast({
          title: "⏰ Ticket Follow-up Overdue",
          description: data.message,
          duration: 10000,
          variant: "destructive",
          action: (
            <ToastAction
              altText="View"
              onClick={() => router.push(`/calls?id=${data.ticketId}`)}
            >
              View Ticket
            </ToastAction>
          ),
        });

        revalidateNotifications();
        markDashboardRealtime("ticket-follow-up-due", data.createdAt);
        revalidateCallCaches();
      },
    );

    socket.on(
      "scheduledCallDue",
      (data: {
        id: number;
        type: string;
        message: string;
        scheduleCallId: number;
        agentId: number | null;
        createdAt: string;
      }) => {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});
        } catch (e) {}

        toast({
          title: "📞 Scheduled Call Due",
          description: data.message,
          duration: 10000,
          variant: "destructive",
          action: (
            <ToastAction
              altText="View"
              onClick={() => router.push(`/calls`)}
            >
              View Calls
            </ToastAction>
          ),
        });

        revalidateNotifications();
        markDashboardRealtime("callback-due", data.createdAt);
        revalidateCallCaches();
      },
    );

    return () => {
      if (revalidateDebounceRef.current)
        clearTimeout(revalidateDebounceRef.current);
      if (dashboardRevalidateDebounceRef.current)
        clearTimeout(dashboardRevalidateDebounceRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, toast, router, mutate]);

  const contextValue = useMemo(
    () => ({ liveCallIds, dashboardRealtime }),
    [dashboardRealtime, liveCallIds],
  );

  return (
    <LiveCallsContext.Provider value={contextValue}>
      {children}
    </LiveCallsContext.Provider>
  );
}

// Legacy hook kept for any existing consumers
export function useCallSocket() {
  // No-op: socket logic moved into CallSocketProvider
}
