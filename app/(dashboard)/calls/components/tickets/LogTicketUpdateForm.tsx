"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { SelectItem } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  SupportTicketStatus,
  type SupportTicketRecord,
  type TicketUpdateRecord,
} from "../../types";
import { TicketStatusToggle } from "./TicketStatusToggle";
import { InspectorSelect } from "../shared/InspectorHelpers";
import { formatEnumLabel } from "../../utils/call-helpers";

interface LogTicketUpdateFormProps {
  ticket: SupportTicketRecord;
  agents: { id: number; name: string }[];
  onLogged?: (result: {
    ticket: SupportTicketRecord;
    updates: TicketUpdateRecord[];
  }) => void;
  onError?: (message: string) => void;
}

export function LogTicketUpdateForm({
  ticket,
  agents,
  onLogged,
  onError,
}: LogTicketUpdateFormProps) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string>(ticket.status || "");
  const [followUpDueDate, setFollowUpDueDate] = useState(
    ticket.followUpDueDate || "",
  );
  const [followUpAssignedToId, setFollowUpAssignedToId] = useState(
    ticket.followUpAssignedToId?.toString() || "",
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNote("");
    setStatus(ticket.status || "");
    setFollowUpDueDate(ticket.followUpDueDate || "");
    setFollowUpAssignedToId(ticket.followUpAssignedToId?.toString() || "");
  }, [ticket.id, ticket.status, ticket.followUpDueDate, ticket.followUpAssignedToId]);

  const followUpDateDisplay = useMemo(() => {
    if (!followUpDueDate) return null;
    const d = new Date(followUpDueDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [followUpDueDate]);

  const statusChanged =
    status.trim().toUpperCase() !== (ticket.status || "").toString().toUpperCase();
  const followUpChanged =
    (followUpDueDate || "") !== (ticket.followUpDueDate || "") ||
    (followUpAssignedToId || "") !==
      (ticket.followUpAssignedToId?.toString() || "");

  const handleSubmit = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      onError?.("A note is required to log an update.");
      return;
    }
    if (statusChanged && !trimmed) {
      onError?.("A note is required when changing status.");
      return;
    }

    const payload: Record<string, unknown> = { note: trimmed };

    if (statusChanged) {
      payload.status = status;
    }

    if (
      status === SupportTicketStatus.PENDING_FOLLOWUP ||
      followUpChanged
    ) {
      if (followUpDueDate) {
        payload.followUpDueDate = new Date(followUpDueDate).toISOString();
      } else if (followUpChanged) {
        payload.followUpDueDate = null;
      }
      if (followUpAssignedToId) {
        payload.followUpAssignedToId = Number(followUpAssignedToId);
      } else if (followUpChanged) {
        payload.followUpAssignedToId = null;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/tickets/${ticket.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        onError?.(result.message ?? "Failed to log update");
        return;
      }
      setNote("");
      onLogged?.(result.data);
    } catch {
      onError?.("Failed to log update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showFollowUp =
    status === SupportTicketStatus.PENDING_FOLLOWUP ||
    ticket.status === SupportTicketStatus.PENDING_FOLLOWUP;

  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Note <span className="text-red-400">*</span>
        </p>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened on this ticket?"
          className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] leading-relaxed"
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Status
        </p>
        <TicketStatusToggle
          value={status}
          onChange={setStatus}
          className="mt-0.5"
        />
      </div>

      {showFollowUp && (
        <div className="grid grid-cols-2 gap-2 rounded-lg p-2.5 bg-amber-50 border border-amber-200/70">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Follow-up date
            </p>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-8 flex items-center gap-2 px-2.5 text-xs rounded-lg border bg-white border-amber-300 text-left"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span
                    className={
                      followUpDateDisplay
                        ? "text-slate-800 font-semibold"
                        : "text-amber-500"
                    }
                  >
                    {followUpDateDisplay || "Pick date…"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    followUpDueDate ? new Date(followUpDueDate) : undefined
                  }
                  onSelect={(date) => {
                    if (!date) return;
                    const d = new Date(date);
                    d.setHours(12, 0, 0, 0);
                    setFollowUpDueDate(d.toISOString());
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assignee
            </p>
            <InspectorSelect
              value={followUpAssignedToId || ""}
              onChange={(v) =>
                setFollowUpAssignedToId(v === "none" ? "" : v)
              }
              placeholder="Assign…"
            >
              <SelectItem value="none">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>
                  {a.name}
                </SelectItem>
              ))}
            </InspectorSelect>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !note.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 text-white text-[12px] font-semibold rounded-xl bg-[#008f68] hover:bg-[#007a5a] disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        {isSubmitting ? "Logging…" : "Log update"}
      </button>
    </div>
  );
}
