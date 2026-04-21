"use client";

import { useMemo, useState } from "react";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { Call } from "@/lib/mock-data";
import type { AgentOption } from "../../types";
import type { CustomerCallGroup } from "./CustomerTimelineDrawer";
import { getTicketAssignee, getAssigneeName } from "../../utils/call-helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAircall } from "@/components/providers/AircallProvider";
import { useToast } from "@/hooks/use-toast";
import { fetchFromBackend } from "@/lib/api-client";

interface InlineCallTimelineProps {
  group: CustomerCallGroup;
  agents: AgentOption[];
}

function formatShortDate(date: Date): string {
  if (isToday(date)) return `Today ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d, HH:mm");
}

function directionMeta(direction?: string) {
  const d = (direction || "").toLowerCase();
  if (d === "outbound") {
    return {
      label: "Outbound",
      color: "text-blue-600",
      ring: "border-blue-500",
      Icon: PhoneOutgoing,
    };
  }
  if (d === "missed") {
    return {
      label: "Missed",
      color: "text-rose-600",
      ring: "border-rose-500",
      Icon: PhoneMissed,
    };
  }
  if (d === "voicemail") {
    return {
      label: "Voicemail",
      color: "text-amber-600",
      ring: "border-amber-500",
      Icon: Voicemail,
    };
  }
  return {
    label: "Inbound",
    color: "text-emerald-600",
    ring: "border-emerald-500",
    Icon: PhoneIncoming,
  };
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function resolveAgentName(call: Call, agents: AgentOption[]): string | null {
  const assignee = getTicketAssignee(call);
  if (assignee) return getAssigneeName(assignee);
  const agentId = (call as any).agentId;
  if (agentId) {
    const found = agents.find((a) => a.id.toString() === agentId.toString());
    if (found) return found.name;
  }
  return null;
}

export function InlineCallTimeline({ group, agents }: InlineCallTimelineProps) {
  const { dial, status, isLoggedIn } = useAircall();
  const { toast } = useToast();
  const canDial = status === "ready" && isLoggedIn;

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const sortedCalls = useMemo(() => {
    return [...group.calls].sort((a, b) => {
      const ad = new Date(a.callDate || a.createdAt || 0).getTime();
      const bd = new Date(b.callDate || b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [group.calls]);

  const lastEventAgo = useMemo(() => {
    const first = sortedCalls[0];
    if (!first) return null;
    const d = new Date(first.callDate || first.createdAt || 0);
    if (isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [sortedCalls]);

  const latestCallId = sortedCalls[0]?.id;
  const hasPhone = !!group.customerPhone && group.customerPhone !== "unknown";
  const canAddNote = !!group.customerId;

  const handleCallBack = () => {
    if (!hasPhone) return;
    dial(group.customerPhone, latestCallId);
  };

  const handleSaveNote = async () => {
    const content = noteContent.trim();
    if (!content || !group.customerId) return;
    setNoteSaving(true);
    try {
      await fetchFromBackend(`/customers/${group.customerId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      toast({
        title: "Note added",
        description: `Saved to ${group.customerName || "customer"}.`,
      });
      setNoteContent("");
      setNoteOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to add note",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <div className="px-4 py-3">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            Call Timeline · {sortedCalls.length}{" "}
            {sortedCalls.length === 1 ? "event" : "events"}
          </div>
          {lastEventAgo && (
            <div className="text-xs text-slate-400 mt-0.5">
              last {lastEventAgo}
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ────────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical guide line */}
        <div className="absolute top-0 bottom-0 left-2.25 w-0.5 bg-gray-200" />
        <ol className="space-y-3">
          {sortedCalls.map((call) => {
            const meta = directionMeta(call.direction);
            const date = new Date(call.callDate || call.createdAt || 0);
            const dateLabel = isNaN(date.getTime())
              ? "—"
              : formatShortDate(date);
            const duration = formatDuration(call.duration ?? undefined);
            const agentName = resolveAgentName(call, agents);
            const notes =
              (call.notes as string | undefined) ||
              ((call as any).issueDetail as string | undefined);
            const Icon = meta.Icon;

            return (
              <li key={call.id} className="relative pl-7">
                {/* Circle */}
                <span
                  className={`absolute left-0 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border-2 ${meta.ring}`}
                >
                  <Icon className={`h-2.5 w-2.5 ${meta.color}`} />
                </span>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="text-slate-500 text-xs font-normal tabular-nums">
                    {dateLabel}
                  </span>
                  <span className={`font-semibold text-sm ${meta.color}`}>
                    {meta.label}
                  </span>
                  {call.duration !== undefined &&
                    call.duration !== null &&
                    call.duration > 0 && (
                      <span className="text-gray-400 text-xs tabular-nums">
                        {duration}
                      </span>
                    )}
                  {agentName && (
                    <>
                      <span className="text-gray-300 select-none">·</span>
                      <span className="text-gray-700 text-xs">{agentName}</span>
                    </>
                  )}
                </div>

                {/* Notes */}
                {notes && (
                  <p className="mt-1 text-gray-600 text-xs leading-snug line-clamp-2 max-w-prose wrap-break-word">
                    {notes}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleCallBack}
          disabled={!hasPhone || !canDial}
          title={
            !hasPhone
              ? "No phone number on file"
              : !canDial
                ? "Aircall is not connected"
                : `Call ${group.customerPhone}`
          }
        >
          <PhoneOutgoing className="h-4 w-4 mr-2" />
          Call back
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => setNoteOpen(true)}
          disabled={!canAddNote}
          title={
            canAddNote
              ? "Add a note to this customer"
              : "Customer not linked yet"
          }
        >
          Add note
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
        >
          Reassign
        </Button>
      </div>

      {/* ── Add note dialog ──────────────────────────────────────── */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>
              {group.customerName
                ? `Saved on ${group.customerName}'s profile.`
                : "Saved on this customer's profile."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type your note…"
            rows={5}
            disabled={noteSaving}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteOpen(false)}
              disabled={noteSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || noteSaving}
            >
              {noteSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
