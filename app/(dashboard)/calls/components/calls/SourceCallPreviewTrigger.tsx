"use client";

import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { SupportTicketRecord } from "../../types";
import { formatEnumLabel, fmtDate } from "../../utils/call-helpers";

type CallSnippet = SupportTicketRecord["call"];

function formatCallDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CallDirIcon({ direction }: { direction?: string | null }) {
  const d = (direction ?? "").toUpperCase();
  if (d === "INBOUND") return <PhoneIncoming className="w-3.5 h-3.5" />;
  if (d === "OUTBOUND") return <PhoneOutgoing className="w-3.5 h-3.5" />;
  if (d === "MISSED") return <PhoneMissed className="w-3.5 h-3.5" />;
  return <Phone className="w-3.5 h-3.5" />;
}

function dirAccent(direction?: string | null) {
  const d = (direction ?? "").toUpperCase();
  if (d === "INBOUND") return { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
  if (d === "OUTBOUND") return { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" };
  if (d === "MISSED") return { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  return { color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };
}

export function SourceCallPreviewTrigger({
  callId,
  call,
  isActive,
  onClick,
}: {
  callId: number;
  call: CallSnippet;
  isActive?: boolean;
  onClick: () => void;
}) {
  const accent = dirAccent(call?.direction);
  const dirLabel =
    (call?.direction ?? "").toUpperCase() === "INBOUND"
      ? "Inbound"
      : (call?.direction ?? "").toUpperCase() === "OUTBOUND"
        ? "Outbound"
        : (call?.direction ?? "").toUpperCase() === "MISSED"
          ? "Missed"
          : call?.direction
            ? formatEnumLabel(call.direction)
            : "Call";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border overflow-hidden transition-all duration-200",
        "bg-white dark:bg-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        isActive
          ? "border-blue-300 ring-2 ring-blue-100 dark:border-blue-700 dark:ring-blue-900/50"
          : "border-blue-100/80 hover:border-blue-200 hover:shadow-md dark:border-neutral-700 dark:hover:border-neutral-600",
      )}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-50 dark:border-neutral-800"
        style={{ boxShadow: `inset 3px 0 0 0 ${accent.color}` }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: accent.bg, color: accent.color }}
        >
          <CallDirIcon direction={call?.direction} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-bold text-slate-800 dark:text-neutral-200">Source Call</p>
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">#{callId}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
            {call?.startedAt ? fmtDate(call.startedAt) : "—"}
            {call?.duration != null && call.duration > 0 && (
              <span className="text-slate-400 dark:text-neutral-500">
                {" "}
                · {formatCallDuration(call.duration)}
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border",
            isActive ? "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800" : "text-slate-600 bg-slate-50 border-slate-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-700",
          )}
        >
          <ExternalLink className="w-3 h-3" />
          Preview
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-50/50 dark:bg-neutral-800/50">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
          style={{
            color: accent.color,
            background: accent.bg,
            borderColor: accent.border,
          }}
        >
          <CallDirIcon direction={call?.direction} />
          {dirLabel}
        </span>
        {call?.agent?.name && (
          <span className="text-[10px] font-medium text-slate-600 dark:text-neutral-300 truncate max-w-[8rem]">
            {call.agent.name}
          </span>
        )}
        {call?.disposition && (
          <span className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
            {formatEnumLabel(call.disposition)}
          </span>
        )}
      </div>
    </button>
  );
}
