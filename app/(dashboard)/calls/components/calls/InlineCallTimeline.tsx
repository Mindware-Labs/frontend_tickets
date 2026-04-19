"use client";

import { useMemo, useState } from "react";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Circle,
  StickyNote,
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
  return format(date, "MMM d HH:mm");
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

function resolveAgentName(call: Call, agents: AgentOption[]): string {
  const assignee = getTicketAssignee(call);
  if (assignee) return getAssigneeName(assignee);
  const agentId = (call as any).agentId;
  if (agentId) {
    const found = agents.find((a) => a.id.toString() === agentId.toString());
    if (found) return found.name;
  }
  return "System";
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
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Call Timeline · {sortedCalls.length}{" "}
            {sortedCalls.length === 1 ? "event" : "events"}
          </div>
          {lastEventAgo ? (
            <div className="text-xs text-muted-foreground mt-0.5">
              last {lastEventAgo}
            </div>
          ) : null}
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative border-l border-muted-foreground/20 ml-2 space-y-4">
        {sortedCalls.map((call) => {
          const meta = directionMeta(call.direction);
          const date = new Date(call.callDate || call.createdAt || 0);
          const dateLabel = isNaN(date.getTime()) ? "—" : formatShortDate(date);
          const duration = formatDuration(call.duration ?? undefined);
          const agentName = resolveAgentName(call, agents);
          const notes = (call as any).notes as string | undefined;
          return (
            <li key={call.id} className="ml-4">
              <span
                className={`absolute -left-1.75 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background border-2 ${meta.ring}`}
              >
                <Circle className="h-1.5 w-1.5 opacity-0" />
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground font-mono text-xs">
                  {dateLabel}
                </span>
                <span className={`font-medium ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {duration}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">{agentName}</span>
              </div>
              {notes ? (
                <p className="text-sm text-foreground/80 mt-1">{notes}</p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
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
          onClick={() => setNoteOpen(true)}
          disabled={!canAddNote}
          title={
            canAddNote
              ? "Add a note to this customer"
              : "Customer not linked yet"
          }
        >
          <StickyNote className="h-4 w-4 mr-2" />
          Add note
        </Button>
      </div>

      {/* Add note dialog */}
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
