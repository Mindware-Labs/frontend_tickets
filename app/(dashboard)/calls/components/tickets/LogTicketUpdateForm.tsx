"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import {
  SupportTicketStatus,
  type SupportTicketRecord,
  type TicketUpdateRecord,
} from "../../types";
import { TicketStatusToggle } from "./TicketStatusToggle";
import { TicketFollowUpFields } from "./TicketFollowUpFields";

interface LogTicketUpdateFormProps {
  ticket: SupportTicketRecord;
  agents: { id: number; name: string }[];
  /** Logged-in agent (fallback for author when JWT user has no agent link) */
  actorAgentId?: number | null;
  onLogged?: (result: {
    ticket: SupportTicketRecord;
    updates: TicketUpdateRecord[];
  }) => void;
  onError?: (message: string) => void;
}

const PEEK_OVERLAY_Z = "z-[120]";

export function LogTicketUpdateForm({
  ticket,
  agents,
  actorAgentId,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNote("");
    setStatus(ticket.status || "");
    setFollowUpDueDate(ticket.followUpDueDate || "");
    setFollowUpAssignedToId(ticket.followUpAssignedToId?.toString() || "");
  }, [
    ticket.id,
    ticket.status,
    ticket.followUpDueDate,
    ticket.followUpAssignedToId,
  ]);

  const statusChanged =
    status.trim().toUpperCase() !==
    (ticket.status || "").toString().toUpperCase();
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

    const payload: Record<string, unknown> = { note: trimmed };
    if (actorAgentId) {
      payload.actorAgentId = actorAgentId;
    }

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
    <form
      className="space-y-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div>
        <label
          htmlFor={`ticket-update-note-${ticket.id}`}
          className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1 block"
        >
          Note <span className="text-red-400">*</span>
        </label>
        <textarea
          id={`ticket-update-note-${ticket.id}`}
          rows={7}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened on this ticket?"
          autoComplete="off"
          className="w-full min-h-[160px] text-sm text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] leading-relaxed"
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          Status
        </p>
        <TicketStatusToggle
          value={status}
          onChange={setStatus}
          className="mt-0.5"
        />
      </div>

      {showFollowUp && (
        <TicketFollowUpFields
          followUpDueDate={followUpDueDate}
          followUpAssignedToId={followUpAssignedToId}
          onFollowUpDueDateChange={setFollowUpDueDate}
          onFollowUpAssignedToIdChange={setFollowUpAssignedToId}
          agents={agents}
          popoverClassName={PEEK_OVERLAY_Z}
          selectContentClassName={PEEK_OVERLAY_Z}
        />
      )}

      <button
        type="submit"
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
    </form>
  );
}
