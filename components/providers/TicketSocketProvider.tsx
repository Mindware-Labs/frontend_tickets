"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { auth } from "@/lib/auth";

export function TicketSocketProvider() {
  const { toast } = useToast();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const user = auth.getUser();

  const socketRef = useRef<Socket | null>(null);

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

    socket.on(
      "ticketAssigned",
      (data: { title: string; message: string; ticketId: number }) => {
        // Reproducir sonido
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});
        } catch (e) {}

        // Mostrar Toast
        toast({
          title: data.title,
          description: data.message,
          duration: 8000,
          className: "bg-slate-900 border-l-4 border-l-blue-500 text-white",
          action: (
            <ToastAction
              altText="Ver"
              // URL
              onClick={() =>
                router.push(`/tickets?view=assigned_me&id=${data.ticketId}`)
              }
              className="text-blue-200 hover:text-white border-blue-200 hover:border-white"
            >
              View Ticket
            </ToastAction>
          ),
        });

        // Recargar datos
        mutate("/api/tickets");
      },
    );

    // Escuchar actualizaciones de tickets en tiempo real (reemplaza polling)
    socket.on(
      "ticketsUpdated",
      (data: { action: string; ticketId: number; timestamp: string }) => {
        // Revalidar la lista de tickets cuando hay cambios
        mutate("/api/tickets");
      },
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, toast, router, mutate]);

  return null;
}
