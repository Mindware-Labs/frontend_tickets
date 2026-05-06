"use client";

import { useMemo, useState } from "react";
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Phone,
  StickyNote,
  Loader2,
  Circle,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { AgentOption, SupportTicketRecord } from "../../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// ---------------------------------------------------------------------------
// Group type
// ---------------------------------------------------------------------------
export interface CustomerTicketGroup {
  key: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  tickets: SupportTicketRecord[];
  latestTicket: SupportTicketRecord;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  EMERGENCY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  IN_PROGRESS:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PENDING_FOLLOWUP:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeStatusKey = (status?: string | null) => {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : key;
};

function formatShortDate(date: Date): string {
  if (isToday(date)) return `Today ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d HH:mm");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function callDirectionIcon(direction?: string | null) {
  const dir = (direction || "").toUpperCase();
  if (dir === "INBOUND") return <PhoneIncoming className="w-2.5 h-2.5" />;
  if (dir === "OUTBOUND") return <PhoneOutgoing className="w-2.5 h-2.5" />;
  if (dir === "MISSED") return <PhoneMissed className="w-2.5 h-2.5" />;
  return <Phone className="w-2.5 h-2.5" />;
}

function statusRing(status: string): string {
  switch (normalizeStatusKey(status)) {
    case "ACTIVE":
    case "OPEN":
      return "border-green-500";
    case "IN_PROGRESS":
      return "border-green-500";
    case "PENDING_FOLLOWUP":
      return "border-amber-500";
    case "OVERDUE":
      return "border-red-500";
    case "RESOLVED":
      return "border-green-500";
    case "CLOSED":
      return "border-gray-400";
    default:
      return "border-muted-foreground/40";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface InlineTicketTimelineProps {
  group: CustomerTicketGroup;
  agents: AgentOption[];
  onOpenView?: (t: SupportTicketRecord) => void;
}

export function InlineTicketTimeline({
  group,
  agents,
  onOpenView,
}: InlineTicketTimelineProps) {
  const { dial, status, isLoggedIn } = useAircall();
  const { toast } = useToast();
  const canDial = status === "ready" && isLoggedIn;

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const sortedTickets = useMemo(() => {
    return [...group.tickets].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [group.tickets]);

  const lastEventAgo = useMemo(() => {
    const first = sortedTickets[0];
    if (!first?.createdAt) return null;
    const d = new Date(first.createdAt);
    if (isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [sortedTickets]);

  const hasPhone = !!group.customerPhone && group.customerPhone !== "unknown";
  const canAddNote = !!group.customerId;
  const latestCallId = sortedTickets[0]?.callId;

  const handleCallBack = () => {
    if (!hasPhone) return;
    dial(group.customerPhone, latestCallId ?? undefined);
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

  const resolveAgent = (t: SupportTicketRecord): string => {
    if (t.assignedTo?.name) return t.assignedTo.name;
    if (t.agentId) {
      const found = agents.find(
        (a) => a.id.toString() === t.agentId!.toString(),
      );
      if (found) return found.name;
    }
    return "Unassigned";
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Ticket Timeline · {sortedTickets.length}{" "}
            {sortedTickets.length === 1 ? "ticket" : "tickets"}
          </div>
          {lastEventAgo && (
            <div className="text-xs text-muted-foreground mt-0.5">
              last {lastEventAgo}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative border-l border-muted-foreground/20 ml-2 space-y-4">
        {sortedTickets.map((ticket) => {
          const date = new Date(ticket.createdAt || 0);
          const dateLabel = isNaN(date.getTime()) ? "—" : formatShortDate(date);
          const agentLabel = resolveAgent(ticket);
          const statusKey = normalizeStatusKey(ticket.status);
          const ring = statusRing(statusKey);
          return (
            <li key={ticket.id} className="ml-4">
              <span
                className={`absolute -left-1.75 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background border-2 ${ring}`}
              >
                <Circle className="h-1.5 w-1.5 opacity-0" />
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground font-mono text-xs">
                  {dateLabel}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColors[statusKey] || ""}`}
                >
                  {formatLabel(statusKey)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${priorityColors[ticket.priority] || ""}`}
                >
                  {formatLabel(ticket.priority)}
                </Badge>
                {ticket.ticketType && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-foreground text-xs">
                      {formatLabel(ticket.ticketType)}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">{agentLabel}</span>
                {onOpenView && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-xs text-primary"
                    onClick={() => onOpenView(ticket)}
                  >
                    #{ticket.id}
                  </Button>
                )}
              </div>
              {ticket.issueDetail && (
                <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                  {ticket.issueDetail}
                </p>
              )}
              {ticket.callId && (
                <div className="mt-1.5 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-100">
                  <span className="text-blue-500">
                    {callDirectionIcon(ticket.call?.direction)}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700">
                    Source Call
                  </span>
                  {ticket.call?.direction && (
                    <>
                      <span className="text-[10px] text-blue-300">·</span>
                      <span className="text-[10px] font-medium text-blue-600">
                        {formatLabel(ticket.call.direction)}
                      </span>
                    </>
                  )}
                  {ticket.call?.startedAt && (
                    <>
                      <span className="text-[10px] text-blue-300">·</span>
                      <span className="font-mono text-[10px] text-blue-500">
                        {formatShortDate(new Date(ticket.call.startedAt))}
                      </span>
                    </>
                  )}
                  {ticket.call?.duration != null &&
                    ticket.call.duration > 0 && (
                      <>
                        <span className="text-[10px] text-blue-300">·</span>
                        <span className="font-mono text-[10px] text-blue-500">
                          {formatDuration(ticket.call.duration)}
                        </span>
                      </>
                    )}
                  {ticket.call?.disposition && (
                    <>
                      <span className="text-[10px] text-blue-300">·</span>
                      <span className="text-[10px] text-blue-500">
                        {formatLabel(ticket.call.disposition)}
                      </span>
                    </>
                  )}
                  {!ticket.call && (
                    <span className="font-mono text-[10px] text-blue-400">
                      #{ticket.callId}
                    </span>
                  )}
                </div>
              )}
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
              ? "No phone number"
              : !canDial
                ? "Aircall not connected"
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
            canAddNote ? "Add a note to this customer" : "Customer not linked"
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
              Add a note for {group.customerName || "this customer"}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your note…"
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || noteSaving}
            >
              {noteSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
