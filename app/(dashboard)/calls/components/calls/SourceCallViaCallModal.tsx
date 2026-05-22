"use client";

import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportTicketRecord } from "../../types";

type CallSnippet = SupportTicketRecord["call"];

function CallDirIcon({
  direction,
  className,
}: {
  direction?: string | null;
  className?: string;
}) {
  const d = (direction ?? "").toUpperCase();
  if (d === "INBOUND") return <PhoneIncoming className={className} />;
  if (d === "OUTBOUND") return <PhoneOutgoing className={className} />;
  if (d === "MISSED") return <PhoneMissed className={className} />;
  return <Phone className={className} />;
}

function dirAccent(direction?: string | null) {
  const d = (direction ?? "").toUpperCase();
  if (d === "INBOUND")
    return { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
  if (d === "OUTBOUND")
    return { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" };
  if (d === "MISSED")
    return { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  return { color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };
}

export function SourceCallViaCallBadge({
  call,
}: {
  call: CallSnippet;
}) {
  const accent = dirAccent(call?.direction);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1",
        "text-[10px] font-semibold leading-none shadow-sm",
      )}
      style={{
        color: accent.color,
        background: accent.bg,
        borderColor: accent.border,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <CallDirIcon direction={call?.direction} className="w-3 h-3 shrink-0" />
      Via Call
    </span>
  );
}
