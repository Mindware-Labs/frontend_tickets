"use client";

import React, {
  createContext,
  useContext,
  useEffect,
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
interface LiveCallsContextValue {
  liveCallIds: Set<number>;
}

const LiveCallsContext = createContext<LiveCallsContextValue>({
  liveCallIds: new Set(),
});

export function useLiveCalls() {
  return useContext(LiveCallsContext);
}

// -- Provider -----------------------------------------------------------------
export function CallSocketProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [liveCallIds, setLiveCallIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const user = auth.getUser();

  const socketRef = useRef<Socket | null>(null);
  const revalidateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

        revalidateCallCaches();
      },
    );

    socket.on(
      "ticketsUpdated",
      (data: { action: string; ticketId: number; timestamp: string }) => {
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
        revalidateCallCaches();
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
        revalidateCallCaches();
      },
    );

    return () => {
      if (revalidateDebounceRef.current)
        clearTimeout(revalidateDebounceRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, toast, router, mutate]);

  return (
    <LiveCallsContext.Provider value={{ liveCallIds }}>
      {children}
    </LiveCallsContext.Provider>
  );
}

// Legacy hook kept for any existing consumers
export function useCallSocket() {
  // No-op: socket logic moved into CallSocketProvider
}
