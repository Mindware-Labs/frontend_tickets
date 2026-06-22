"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, Copy, Check, MapPin, PhoneCall, Ticket,
  Calendar, Clock, AlertCircle, PhoneIncoming, PhoneOutgoing,
  PhoneMissed,
} from "lucide-react";
import { Customer } from "../types";
import { fetchFromBackend } from "@/lib/api-client";

interface Customer360DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

interface RecentCall {
  id: number;
  direction: string;
  status: string;
  disposition?: string;
  notes?: string;
  createdAt: string;
  duration?: number;
  agent?: { name: string } | null;
  assignedTo?: { name: string } | null;
  yard?: { name: string } | null;
  campaign?: { nombre?: string; name?: string } | null;
  followUpDueDate?: string | null;
}

const directionIcon = (d: string) => {
  const dir = d?.toUpperCase();
  if (dir === "INBOUND") return <PhoneIncoming className="h-3.5 w-3.5 text-blue-500" />;
  if (dir === "OUTBOUND") return <PhoneOutgoing className="h-3.5 w-3.5 text-green-500" />;
  return <PhoneMissed className="h-3.5 w-3.5 text-red-400" />;
};

const statusColor = (s: string) => {
  const st = s?.toUpperCase();
  if (st === "COMPLETED") return "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300";
  if (st === "ACTIVE") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  if (st === "OVERDUE") return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300";
  if (st === "PENDING_FOLLOWUP") return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  return "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400";
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    COMPLETED: "Completed",
    ACTIVE: "Active",
    OVERDUE: "Overdue",
    PENDING_FOLLOWUP: "Follow-up",
  };
  return map[s?.toUpperCase()] ?? s;
};

const dispositionLabel = (d?: string) => {
  if (!d) return null;
  const map: Record<string, string> = {
    RESOLVED: "Resolved",
    CALLBACK_REQUIRED: "Callback Required",
    CALLBACK_SCHEDULED: "Callback Scheduled",
    VOICEMAIL_LEFT: "Voicemail",
    NO_ANSWER: "No Answer",
    NEW_LEAD: "New Lead",
    PROMISE_TO_PAY: "Promise to Pay",
    DISPUTE: "Dispute",
    WRONG_NUMBER: "Wrong Number",
    ENROLLED: "Enrolled",
    ESCALATED: "Escalated",
  };
  return map[d.toUpperCase()] ?? d;
};

const fmtDuration = (sec?: number) => {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function Customer360Drawer({ open, onOpenChange, customer }: Customer360DrawerProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [detail, setDetail] = useState<Customer | null>(null);

  useEffect(() => {
    if (!open || !customer) return;
    setDetail(null);
    setRecentCalls([]);

    // Fetch enriched customer detail
    fetchFromBackend(`/customers/${customer.id}`)
      .then((data: any) => setDetail(data?.data ?? data))
      .catch(() => setDetail(customer));

    // Fetch recent calls for this customer
    setLoadingCalls(true);
    fetchFromBackend(`/calls?customerId=${customer.id}&limit=5&page=1`)
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setRecentCalls(arr.slice(0, 5));
      })
      .catch(() => setRecentCalls([]))
      .finally(() => setLoadingCalls(false));
  }, [open, customer?.id]);

  if (!customer) return null;

  const c = detail ?? customer;

  const initials = c.name
    ? c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  const handleCopy = () => {
    if (!c.phone) return;
    navigator.clipboard.writeText(c.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarFallback className="bg-emerald-600/10 text-[#008f68] font-bold text-sm dark:bg-emerald-400/10 dark:text-emerald-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-semibold text-slate-900 dark:text-neutral-100 leading-tight truncate">
                {c.name || "Unknown Customer"}
              </SheetTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer since {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
              </p>
            </div>
            {(c.openTickets ?? 0) > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium shrink-0">
                {c.openTickets} open
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-5">

            {/* Pinned note */}
            {c.pinnedNote && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800 leading-snug">{c.pinnedNote}</p>
              </div>
            )}

            {/* Contact info */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-200">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium">{c.phone || "—"}</span>
                </div>
                {c.phone && (
                  <button onClick={handleCopy} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors">
                    {copied
                      ? <Check className="h-3.5 w-3.5 text-green-600" />
                      : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                )}
              </div>
              {c.yard && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm">{c.yard.name}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: PhoneCall, label: "Total Calls", value: c.totalCalls ?? 0 },
                { icon: Ticket, label: "Open Tickets", value: c.openTickets ?? 0 },
                {
                  icon: Calendar, label: "Last Contact",
                  value: c.lastContactAt
                    ? new Date(c.lastContactAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200/60 dark:border-neutral-700 p-3 text-center">
                  <Icon className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-neutral-100 leading-none">{value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Campaigns */}
            {c.campaigns && c.campaigns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Campaigns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.campaigns.map((camp: { id: number; nombre: string }) => (
                      <Badge key={camp.id} variant="outline" className="text-[11px] border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300">
                        {camp.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Recent calls */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Calls</p>

              {loadingCalls ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : recentCalls.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No calls found.</p>
              ) : (
                <div className="space-y-2">
                  {recentCalls.map((call) => {
                    const agentName = call.agent?.name ?? call.assignedTo?.name;
                    const campaignName = call.campaign?.nombre ?? call.campaign?.name;
                    const disp = dispositionLabel(call.disposition);
                    const dur = fmtDuration(call.duration);
                    return (
                      <div
                        key={call.id}
                        onClick={() => { onOpenChange(false); router.push(`/calls?id=${call.id}`); }}
                        className="bg-slate-50 dark:bg-neutral-800/50 rounded-lg border border-slate-200/60 dark:border-neutral-700 p-3 space-y-1.5 cursor-pointer hover:border-[#008f68]/40 hover:bg-[#f0fdf8] dark:hover:bg-emerald-500/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {directionIcon(call.direction)}
                            <span className="text-xs font-medium text-slate-700 dark:text-neutral-200 capitalize">
                              {call.direction?.toLowerCase()}
                            </span>
                            {dur && <span className="text-[11px] text-slate-400">· {dur}</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor(call.status)}`}>
                              {statusLabel(call.status)}
                            </span>
                            <span className="text-[11px] text-slate-400">{fmtDate(call.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
                          {disp && <span className="font-medium text-slate-600 dark:text-neutral-300">{disp}</span>}
                          {agentName && <span>Agent: {agentName}</span>}
                          {campaignName && <span>{campaignName}</span>}
                          {call.yard?.name && <span>{call.yard.name}</span>}
                        </div>

                        {call.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 italic">"{call.notes}"</p>
                        )}

                        {call.followUpDueDate && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600">
                            <Clock className="h-3 w-3" />
                            <span>Follow-up: {new Date(call.followUpDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            {c.notes && c.notes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Notes</p>
                  <div className="space-y-2">
                    {c.notes.map((note: { id: number; content: string; createdAt: string; createdBy?: string }) => (
                      <div key={note.id} className="bg-slate-50 dark:bg-neutral-800/50 rounded-lg border border-slate-200/60 dark:border-neutral-700 p-3">
                        <p className="text-sm text-slate-700 dark:text-neutral-200 leading-snug">{note.content}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          {note.createdBy && <><span>·</span><span>{note.createdBy}</span></>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
