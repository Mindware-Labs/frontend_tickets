"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAircall } from "@/components/providers/AircallProvider";
import { Activity, Ticket as TicketIcon, X } from "lucide-react";
import type { SupportTicketRecord, TicketUpdateRecord } from "../../types";
import { LogTicketUpdateForm } from "./LogTicketUpdateForm";

interface TicketUpdatePeekPanelProps {
  open: boolean;
  ticket: SupportTicketRecord | null;
  agents: { id: number; name: string }[];
  actorAgentId?: number | null;
  onClose: () => void;
  onLogged?: (result: {
    ticket: SupportTicketRecord;
    updates: TicketUpdateRecord[];
  }) => void;
  onError?: (message: string) => void;
}

export function TicketUpdatePeekPanel({
  open,
  ticket,
  agents,
  actorAgentId,
  onClose,
  onLogged,
  onError,
}: TicketUpdatePeekPanelProps) {
  const isMobile = useIsMobile();
  const { dockOpen, sheetOpen: aircallSheetOpen } = useAircall();
  const aircallOnLeft = dockOpen && aircallSheetOpen;
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const t = setTimeout(() => setActive(false), 300);
      return () => clearTimeout(t);
    }
    setActive(true);
    setVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [ticket?.id, open]);

  if (!mounted || !active || !ticket) return null;

  const handleClose = (e?: MouseEvent | PointerEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onClose();
  };

  const accent = "#7c3aed";

  const mobileClasses = cn(
    "fixed bottom-0 left-0 right-0 z-[100] flex flex-col overflow-hidden",
    "pointer-events-auto",
    "bg-white dark:bg-neutral-900 rounded-t-2xl",
    "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.14)]",
    "border border-slate-200/80 dark:border-neutral-700",
    "max-h-[88vh]",
    "transition-all duration-300 ease-out",
    visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
  );

  const desktopClasses = cn(
    "fixed z-[100] pointer-events-auto flex flex-col overflow-hidden",
    "bg-[#f8f9fb] dark:bg-neutral-950 rounded-2xl border border-slate-200/80 dark:border-neutral-700",
    "shadow-[0_20px_40px_-8px_rgba(0,0,0,0.14),0_8px_16px_-6px_rgba(0,0,0,0.08)]",
    !aircallOnLeft && "w-[min(420px,calc(100vw-2rem))]",
    aircallOnLeft && "min-w-[300px] max-w-[420px]",
    "transition-all duration-300 ease-out",
    visible
      ? "translate-x-0 opacity-100 scale-100"
      : "translate-x-4 opacity-0 scale-95",
  );

  const containerClass = isMobile ? mobileClasses : desktopClasses;
  const containerStyle = isMobile
    ? undefined
    : {
        right: "calc(min(80svw, 1100px) + 1rem)",
        top: "4rem",
        maxHeight: "calc(100vh - 5rem)",
        ...(aircallOnLeft ? { left: "calc(1.5rem + 380px + 1rem)" } : {}),
      };

  const panel = (
    <>
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto",
            visible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Log update for ticket #${ticket.id}`}
        data-peek-panel="true"
        data-ticket-log-update-panel="true"
        className={containerClass}
        style={containerStyle}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="shrink-0 flex justify-center pt-3 pb-1 bg-white dark:bg-neutral-900 rounded-t-2xl">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
        )}

        <div
          className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-t-2xl"
          style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ background: `${accent}14`, color: accent }}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-neutral-100 leading-tight truncate">
                Log update
              </p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight mt-0.5 flex items-center gap-1">
                <TicketIcon className="w-3 h-3 shrink-0" />
                Ticket #{ticket.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 bg-white dark:bg-neutral-900 pointer-events-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/40 dark:bg-violet-500/10 px-3 py-2">
            <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
              Add a note and change status or follow-up. The full history is
              visible in the ticket drawer.
            </p>
          </div>

          <LogTicketUpdateForm
            ticket={ticket}
            agents={agents}
            actorAgentId={actorAgentId}
            onLogged={(result) => {
              onLogged?.(result);
              onClose();
            }}
            onError={onError}
          />
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
