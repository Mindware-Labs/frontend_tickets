"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type {
  default as AircallWorkspaceType,
  AircallLoginSettings,
  AircallIncomingCallPayload,
  AircallEndedCallPayload,
} from "aircall-everywhere";
import { Phone, PhoneIncoming, X, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { fetchFromBackend } from "@/lib/api-client";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
export interface AircallAgent {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export type AircallStatus = "loading" | "ready" | "error";
export type AircallMountMode = "dock" | "fullscreen";

export interface IncomingCallState {
  from: string;
  to: string;
  callId?: number;
  contactName?: string;
  receivedAt: number;
}

interface AircallContextValue {
  status: AircallStatus;
  isLoggedIn: boolean;
  agent: AircallAgent | null;
  errorMessage: string | null;
  dockOpen: boolean;
  /** Current rendering mode: floating dock or full-screen panel. */
  mountMode: AircallMountMode;
  setMountMode: (mode: AircallMountMode) => void;
  /** Register a DOM node where the fullscreen panel should be portaled into. */
  setFullscreenContainer: (node: HTMLElement | null) => void;
  /** Fill the Aircall dialer with a phone number. Optionally associates a ticketId. */
  dial: (phoneNumber: string, ticketId?: number | string) => boolean;
  openDock: () => void;
  closeDock: () => void;
  toggleDock: () => void;
  /** Subscribe to a raw SDK event. Returns unsubscribe. */
  on: <T = any>(event: string, handler: (data: T) => void) => () => void;
  lastIncomingCall: IncomingCallState | null;
  /** True when a right-side sheet/drawer is open — moves the FAB to the bottom edge. */
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

const AircallContext = createContext<AircallContextValue | null>(null);

export function useAircall(): AircallContextValue {
  const ctx = useContext(AircallContext);
  if (!ctx) {
    throw new Error("useAircall must be used inside <AircallProvider>");
  }
  return ctx;
}

// ────────────────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────────────────
const DOM_CONTAINER_ID = "aircall-phone-container";

export function AircallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const workspaceRef = useRef<AircallWorkspaceType | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const pendingDialRef = useRef<{
    phone: string;
    ticketId?: number | string;
    at: number;
  } | null>(null);

  const [status, setStatus] = useState<AircallStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agent, setAgent] = useState<AircallAgent | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [mountMode, setMountMode] = useState<AircallMountMode>("dock");
  const [fullscreenContainer, setFullscreenContainer] =
    useState<HTMLElement | null>(null);
  const [lastIncomingCall, setLastIncomingCall] =
    useState<IncomingCallState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Stable pub/sub so consumers can subscribe once
  const dispatchEvent = useCallback((event: string, data: any) => {
    const set = listenersRef.current.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        // swallow listener errors so one consumer can't break others
        if (process.env.NODE_ENV === "development") {
          console.error(`[AircallProvider] listener error (${event})`, err);
        }
      }
    });
  }, []);

  const on = useCallback(
    <T = any,>(event: string, handler: (data: T) => void) => {
      const map = listenersRef.current;
      if (!map.has(event)) map.set(event, new Set());
      map.get(event)!.add(handler as any);
      return () => {
        map.get(event)?.delete(handler as any);
      };
    },
    [],
  );

  // ── Mount the SDK once ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("aircall-everywhere");
        if (cancelled) return;
        const AircallWorkspace = mod.default;

        const workspace = new AircallWorkspace({
          domToLoadWorkspace: `#${DOM_CONTAINER_ID}`,
          size: "auto",
          debug: process.env.NODE_ENV === "development",
          onLogin: (settings: AircallLoginSettings) => {
            const info: AircallAgent = {
              email: settings.user.email,
              firstName: settings.user.first_name,
              lastName: settings.user.last_name,
              companyName: settings.user.company_name,
            };
            setAgent(info);
            setIsLoggedIn(true);

            // Pre-sync agent with backend so we don't need to wait for first webhook.
            fetchFromBackend("/agents/sync-from-aircall", {
              method: "POST",
              body: JSON.stringify({
                email: info.email,
                firstName: info.firstName,
                lastName: info.lastName,
              }),
            }).catch((err) => {
              if (process.env.NODE_ENV === "development") {
                console.warn("[AircallProvider] sync-from-aircall failed", err);
              }
            });
          },
          onLogout: () => {
            setAgent(null);
            setIsLoggedIn(false);
          },
        });

        workspaceRef.current = workspace;

        // NOTE: we intentionally do NOT call workspace.isLoggedIn() here.
        // The SDK's `send` transport is not ready until the `onLogin`
        // callback fires, so calling it eagerly spams the console with
        // "Aircall Workspace has not been identified yet" warnings.
        // The onLogin/onLogout handlers above keep `isLoggedIn` in sync.

        // Wire the SDK events into our pub/sub + built-in reactions
        const forward = (event: string) => {
          workspace.on(event, (data: any) => {
            dispatchEvent(event, data);
          });
        };

        forward("call_end_ringtone");
        forward("outgoing_call");
        forward("outgoing_answered");
        forward("external_dialer");
        forward("dialer_no_seat_available");
        forward("comments_saved");

        workspace.on("incoming_call", (data: AircallIncomingCallPayload) => {
          const contactName = data.contact
            ? [data.contact.first_name, data.contact.last_name]
                .filter(Boolean)
                .join(" ") || data.contact.company_name
            : undefined;
          const state: IncomingCallState = {
            from: data.from,
            to: data.to,
            callId: data.call_id,
            contactName,
            receivedAt: Date.now(),
          };
          setLastIncomingCall(state);
          setDockOpen(true);
          dispatchEvent("incoming_call", data);
        });

        workspace.on("call_ended", (data: AircallEndedCallPayload) => {
          dispatchEvent("call_ended", data);
        });

        if (!cancelled) setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        setErrorMessage(err?.message || "Could not load the Aircall SDK");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      workspaceRef.current = null;
      listenersRef.current.clear();
    };
  }, [dispatchEvent]);

  // ── Public actions ──────────────────────────────────────────────────────
  const dial = useCallback(
    (phoneNumber: string, ticketId?: number | string): boolean => {
      const ws = workspaceRef.current;
      if (!ws) {
        toast({
          title: "Aircall is not ready",
          description: "Please wait until the softphone finishes loading.",
          variant: "destructive",
        });
        return false;
      }
      if (!isLoggedIn) {
        setDockOpen(true);
        toast({
          title: "Sign in to Aircall",
          description:
            "To make calls, open the dock and sign in with your Aircall account.",
        });
        return false;
      }

      pendingDialRef.current = {
        phone: phoneNumber,
        ticketId,
        at: Date.now(),
      };

      ws.send("dial_number", { phone_number: phoneNumber }, (success, data) => {
        if (!success && process.env.NODE_ENV === "development") {
          console.warn("[AircallProvider] dial_number failed", data);
        }
      });

      // Tag the dialed call with our ticketId as external_id once the
      // outgoing_call event fires (fire-and-forget).
      if (ticketId != null) {
        const off = on("outgoing_call", () => {
          ws.send("set_external_id", { external_id: String(ticketId) });
          off();
        });
        // Safety cleanup after 30s in case the agent cancels the call.
        setTimeout(() => off(), 30_000);
      }

      setDockOpen(true);
      return true;
    },
    [isLoggedIn, on, toast],
  );

  // ── Incoming call toast (global, survives route changes) ────────────────
  useEffect(() => {
    const off = on<AircallIncomingCallPayload>("incoming_call", (data) => {
      const contactName = data.contact
        ? [data.contact.first_name, data.contact.last_name]
            .filter(Boolean)
            .join(" ") || data.contact.company_name
        : undefined;
      const label = contactName || data.from || "Unknown";

      toast({
        title: "Incoming call",
        description: `From ${label}${data.to ? ` → ${data.to}` : ""}`,
        duration: 15_000,
        action: (
          <ToastAction
            altText="View tickets"
            onClick={() => {
              if (data.from) {
                router.push(`/calls?search=${encodeURIComponent(data.from)}`);
              } else {
                router.push("/calls");
              }
            }}
          >
            View tickets
          </ToastAction>
        ),
      });
    });
    return off;
  }, [on, router, toast]);

  // ── Context value ───────────────────────────────────────────────────────
  const openDock = useCallback(() => setDockOpen(true), []);
  const closeDock = useCallback(() => setDockOpen(false), []);
  const toggleDock = useCallback(() => setDockOpen((v) => !v), []);

  const value = useMemo<AircallContextValue>(
    () => ({
      status,
      isLoggedIn,
      agent,
      errorMessage,
      dockOpen,
      mountMode,
      setMountMode,
      setFullscreenContainer,
      dial,
      openDock,
      closeDock,
      toggleDock,
      on,
      lastIncomingCall,
      sheetOpen,
      setSheetOpen,
    }),
    [
      status,
      isLoggedIn,
      agent,
      errorMessage,
      dockOpen,
      mountMode,
      sheetOpen,
      dial,
      openDock,
      closeDock,
      toggleDock,
      on,
      lastIncomingCall,
    ],
  );

  return (
    <AircallContext.Provider value={value}>
      {children}
      <AircallDock
        status={status}
        errorMessage={errorMessage}
        isLoggedIn={isLoggedIn}
        agent={agent}
        open={dockOpen}
        mountMode={mountMode}
        fullscreenContainer={fullscreenContainer}
        onToggle={toggleDock}
        onClose={closeDock}
        lastIncomingCall={lastIncomingCall}
        sheetOpen={sheetOpen}
      />
    </AircallContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dock UI
// ────────────────────────────────────────────────────────────────────────────
interface AircallDockProps {
  status: AircallStatus;
  errorMessage: string | null;
  isLoggedIn: boolean;
  agent: AircallAgent | null;
  open: boolean;
  mountMode: AircallMountMode;
  fullscreenContainer: HTMLElement | null;
  onToggle: () => void;
  onClose: () => void;
  lastIncomingCall: IncomingCallState | null;
  sheetOpen: boolean;
}

function AircallDock({
  status,
  errorMessage,
  isLoggedIn,
  agent,
  open,
  mountMode,
  fullscreenContainer,
  onToggle,
  onClose,
  lastIncomingCall,
  sheetOpen,
}: AircallDockProps) {
  const isFullscreen = mountMode === "fullscreen";
  const panelVisible = isFullscreen || open;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dockParentRef = useRef<HTMLDivElement | null>(null);

  // ── Drag state ────────────────────────────────────────────────────────────
  // null = default CSS position (bottom-right). Set after first drag.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const BTN_SIZE = 56; // h-14 w-14
  const PANEL_W = 380;
  const PANEL_H = 600;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Stop the native event from reaching Radix's document-level listener,
    // which would otherwise treat this as an "outside click" and close any
    // open Sheet/Dialog.
    e.nativeEvent.stopImmediatePropagation();
    if (isFullscreen) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    const newX = clamp(drag.originX + dx, 0, window.innerWidth - BTN_SIZE);
    const newY = clamp(drag.originY + dy, 0, window.innerHeight - BTN_SIZE);
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) onToggle(); // pure click
  };

  // Panel position: appear above/beside the button, clamped to viewport
  const panelStyle = (): React.CSSProperties => {
    if (!pos)
      return { height: `${PANEL_H}px`, maxHeight: "calc(100vh - 140px)" };
    const gap = 12;
    let left = pos.x + BTN_SIZE / 2 - PANEL_W / 2;
    let top = pos.y - PANEL_H - gap;
    // flip below if not enough space above
    if (top < 8) top = pos.y + BTN_SIZE + gap;
    left = clamp(left, 8, window.innerWidth - PANEL_W - 8);
    top = clamp(top, 8, window.innerHeight - PANEL_H - 8);
    return {
      left,
      top,
      height: `${PANEL_H}px`,
      maxHeight: "calc(100vh - 140px)",
    };
  };

  useEffect(() => {
    const panel = panelRef.current;
    const dockParent = dockParentRef.current;
    if (!panel || !dockParent) return;
    const target =
      isFullscreen && fullscreenContainer ? fullscreenContainer : dockParent;
    if (panel.parentElement !== target) {
      target.appendChild(panel);
    }
    return () => {
      if (
        panel.parentElement !== dockParentRef.current &&
        dockParentRef.current
      ) {
        dockParentRef.current.appendChild(panel);
      }
    };
  }, [isFullscreen, fullscreenContainer]);

  const movedToContainer = isFullscreen && !!fullscreenContainer;

  return (
    <>
      {/* Floating toggle button — draggable */}
      <button
        type="button"
        data-aircall-fab="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={open ? "Hide Aircall phone" : "Show Aircall phone"}
        className={cn(
          "fixed z-[60] h-14 w-14 rounded-full shadow-lg select-none",
          "flex items-center justify-center",
          "transition-[bottom,right,left] duration-300 ease-in-out",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "pointer-events-auto",
          open && !dragRef.current?.moved && "scale-90",
          isFullscreen && "hidden",
          !pos && (sheetOpen ? "bottom-6 left-6" : "bottom-6 right-6"),
        )}
        style={
          pos
            ? { left: pos.x, top: pos.y, cursor: "grab", pointerEvents: "auto" }
            : { cursor: "grab", pointerEvents: "auto" }
        }
      >
        {lastIncomingCall &&
        Date.now() - lastIncomingCall.receivedAt < 30_000 ? (
          <PhoneIncoming className="h-6 w-6 animate-pulse" />
        ) : (
          <Phone className="h-6 w-6" />
        )}
        {status === "ready" && isLoggedIn && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        )}
        {status === "ready" && !isLoggedIn && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-amber-500 border-2 border-background" />
        )}
        {status === "error" && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
        )}
      </button>

      <div ref={dockParentRef}>
        <div
          ref={panelRef}
          data-aircall-panel="true"
          className={cn(
            "border bg-background overflow-hidden transition-all duration-200",
            movedToContainer
              ? "absolute inset-0 rounded-none shadow-none opacity-100 scale-100 pointer-events-auto"
              : cn(
                  "z-[60] w-95 max-w-[92vw] rounded-xl shadow-2xl",
                  pos
                    ? "fixed origin-bottom"
                    : sheetOpen
                      ? "fixed bottom-24 left-6 origin-bottom-left"
                      : "fixed bottom-24 right-6 origin-bottom-right",
                  open
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none",
                ),
          )}
          style={
            movedToContainer
              ? { pointerEvents: "auto" }
              : { ...panelStyle(), pointerEvents: open ? "auto" : "none" }
          }
          aria-hidden={!panelVisible}
        >
          {/* Dock header */}
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2 bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {agent
                  ? `${agent.firstName} ${agent.lastName}`.trim() || agent.email
                  : "Aircall"}
              </span>
              {status === "ready" && (
                <span
                  className={cn(
                    "text-[10px] uppercase px-1.5 py-0.5 rounded",
                    isLoggedIn
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  )}
                >
                  {isLoggedIn ? "Online" : "Sign in"}
                </span>
              )}
            </div>
            <div
              className={cn(
                "flex items-center gap-1",
                movedToContainer && "hidden",
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status overlays */}
          {status === "loading" && (
            <div className="absolute inset-x-0 top-11 bottom-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">Loading Aircall…</p>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-x-0 top-11 bottom-0 flex flex-col items-center justify-center gap-2 p-4 bg-background">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Failed to load Aircall
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {errorMessage}
              </p>
            </div>
          )}

          {/* SDK iframe container — always mounted */}
          <div
            id={DOM_CONTAINER_ID}
            className="w-full h-[calc(100%-2.75rem)] [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0 [&>iframe]:block"
          />
        </div>
      </div>
    </>
  );
}
