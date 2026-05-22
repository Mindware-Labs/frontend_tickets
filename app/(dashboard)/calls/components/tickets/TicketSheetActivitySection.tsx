"use client";

import { useMemo } from "react";
import { Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportTicketRecord, TicketUpdateRecord } from "../../types";
import { formatEnumLabel } from "../../utils/call-helpers";
import { TicketStatusToggle } from "./TicketStatusToggle";
import { TicketActivityTimeline } from "./TicketActivityTimeline";

interface TicketSheetActivitySectionProps {
  ticket: SupportTicketRecord;
  updates: TicketUpdateRecord[];
  isLoading?: boolean;
  className?: string;
}

export function TicketSheetActivitySection({
  ticket,
  updates,
  isLoading,
  className,
}: TicketSheetActivitySectionProps) {
  const statusHistory = useMemo(() => {
    return updates
      .filter((u) => u.type === "STATUS_CHANGE" && u.fromStatus && u.toStatus)
      .map((u) => ({
        id: u.id,
        from: formatEnumLabel(u.fromStatus!),
        to: formatEnumLabel(u.toStatus!),
        author:
          u.authorName ||
          u.agent?.name ||
          (typeof u.metadata?.userName === "string"
            ? u.metadata.userName
            : null) ||
          "—",
        at: u.createdAt,
      }));
  }, [updates]);

  return (
    <section
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-50">
        <div className="w-5 h-5 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
          <Activity className="w-3 h-3 text-violet-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-700 leading-tight">
          Activity
        </span>
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300 ml-auto" />
        ) : (
          <span className="ml-auto text-[10px] font-semibold text-slate-400 tabular-nums">
            {updates.length} update{updates.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="px-3.5 py-3 space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            Current status
          </p>
          <TicketStatusToggle
            value={ticket.status || ""}
            onChange={() => {}}
            readOnly
            className="mt-0.5"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            To change status, use{" "}
            <span className="font-semibold text-violet-700">Log update</span>{" "}
            (notes are required).
          </p>
        </div>

        {statusHistory.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Status history
            </p>
            <ul className="space-y-1">
              {statusHistory.map((row) => (
                <li
                  key={row.id}
                  className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5"
                >
                  <span className="font-medium text-slate-800">{row.from}</span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className="font-medium text-slate-800">{row.to}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {row.author}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Notes &amp; updates
          </p>
          <TicketActivityTimeline
            updates={updates}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
