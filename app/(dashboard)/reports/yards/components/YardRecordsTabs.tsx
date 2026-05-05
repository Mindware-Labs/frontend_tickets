"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Phone,
  Ticket as TicketIcon,
  PenLine,
  User,
  Calendar,
  ArrowRight,
  Inbox,
  Search,
  X,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Ticket } from "./types";
import { cn } from "@/lib/utils";

type Tab = "calls" | "tickets" | "manual-records";

type Props = {
  tickets: Ticket[];
};

type CustomerGroup = {
  key: string;
  customerLabel: string;
  phoneLabel: string;
  tickets: Ticket[];
  latestTicket: Ticket;
  latestDateMs: number;
};

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtLabel = (v?: string | null) =>
  (v || "Unspecified").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const customerLabel = (t: Ticket) =>
  t.customer?.name || t.customerPhone || t.customer?.phone || (t.customerId ? `Customer #${t.customerId}` : "Unknown");

const phoneLabel = (t: Ticket) => t.customer?.phone || t.customerPhone || t.phone || "—";

const agentLabel = (t: Ticket) => t.assignedTo?.name || t.agent?.name || "Unassigned";

const dateMs = (t: Ticket) => new Date(t.createdAt || t.updatedAt || 0).getTime();

const groupKey = (t: Ticket) => {
  const id = t.customer?.id ?? t.customerId;
  if (id != null) return `id:${id}`;
  const ph = phoneLabel(t).toLowerCase().replace(/\s+/g, "");
  if (ph && ph !== "—") return `ph:${ph}`;
  const nm = customerLabel(t).toLowerCase().trim();
  if (nm && nm !== "unknown") return `nm:${nm}`;
  return `t:${t.id}`;
};

const normDir = (v?: string | null) => (v || "").toUpperCase();

const statusColor = (s?: string | null) => {
  const v = (s || "").toUpperCase();
  if (v === "ACTIVE" || v === "OPEN") return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (v === "PENDING_FOLLOWUP" || v === "IN_PROGRESS") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  if (v === "OVERDUE") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (v === "COMPLETED" || v === "CLOSED" || v === "RESOLVED") return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

// ─── tab filtering ───────────────────────────────────────────────────────────

function filterTab(tickets: Ticket[], tab: Tab): Ticket[] {
  if (tab === "calls") return tickets.filter((t) => !!t.aircallId);
  if (tab === "tickets")
    return tickets.filter(
      (t) => !!t.aircallId && (normDir(t.direction) === "INBOUND" || normDir(t.direction) === "OUTBOUND"),
    );
  return tickets.filter((t) => !t.aircallId);
}

// ─── grouping ────────────────────────────────────────────────────────────────

function buildGroups(tickets: Ticket[]): CustomerGroup[] {
  const map = new Map<string, CustomerGroup>();
  tickets.forEach((t) => {
    const key = groupKey(t);
    const ms = dateMs(t);
    const existing = map.get(key);
    if (existing) {
      existing.tickets.push(t);
      if (ms > existing.latestDateMs) { existing.latestTicket = t; existing.latestDateMs = ms; }
    } else {
      map.set(key, { key, customerLabel: customerLabel(t), phoneLabel: phoneLabel(t), tickets: [t], latestTicket: t, latestDateMs: ms });
    }
  });
  return Array.from(map.values())
    .map((g) => ({ ...g, tickets: [...g.tickets].sort((a, b) => dateMs(b) - dateMs(a)) }))
    .sort((a, b) => b.latestDateMs - a.latestDateMs || b.tickets.length - a.tickets.length);
}

// ─── tab definitions ─────────────────────────────────────────────────────────

const TABS: { value: Tab; label: string; icon: React.ReactNode; sub: string }[] = [
  { value: "calls",          label: "Calls",          icon: <Phone className="h-4 w-4" />,     sub: "All Aircall records" },
  { value: "tickets",        label: "Tickets",        icon: <TicketIcon className="h-4 w-4" />, sub: "Answered calls (inbound & outbound)" },
  { value: "manual-records", label: "Manual Records", icon: <PenLine className="h-4 w-4" />,   sub: "Manually created entries" },
];

// ─── component ───────────────────────────────────────────────────────────────

export function YardRecordsTabs({ tickets }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("calls");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [noteTicket, setNoteTicket] = useState<Ticket | null>(null);

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => dateMs(b) - dateMs(a)),
    [tickets],
  );

  const counts = useMemo(
    () => ({
      calls: filterTab(sorted, "calls").length,
      tickets: filterTab(sorted, "tickets").length,
      "manual-records": filterTab(sorted, "manual-records").length,
    }),
    [sorted],
  );

  const filtered = useMemo(() => {
    const byType = filterTab(sorted, activeTab);
    if (!search.trim()) return byType;
    const q = search.toLowerCase();
    return byType.filter(
      (t) =>
        t.id.toString().includes(q) ||
        customerLabel(t).toLowerCase().includes(q) ||
        phoneLabel(t).toLowerCase().includes(q) ||
        agentLabel(t).toLowerCase().includes(q) ||
        fmtLabel(t.direction).toLowerCase().includes(q) ||
        fmtLabel(t.disposition).toLowerCase().includes(q) ||
        fmtLabel(t.status).toLowerCase().includes(q) ||
        (t.notes?.toLowerCase() || "").includes(q),
    );
  }, [sorted, activeTab, search]);

  const groups = useMemo(() => buildGroups(filtered), [filtered]);

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const showDir = activeTab !== "manual-records";

  return (
    <>
      <div className="rounded-2xl border bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Records</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tickets.length} total entries in period
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customer, agent, disposition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as Tab); setExpanded({}); }}>
          <div className="border-b bg-muted/30 px-4 pt-3 pb-0">
            <TabsList className="h-11 bg-transparent p-0 gap-1 border-b-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "relative gap-2 rounded-t-lg rounded-b-none px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all",
                    "data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/60",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    "bg-muted/60 text-muted-foreground",
                    "data-[state=active]:bg-primary/15 data-[state=active]:text-primary",
                  )}>
                    {counts[tab.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="m-0 p-0">
              <div className="px-4 py-2 border-b bg-muted/10">
                <p className="text-xs text-muted-foreground">{tab.sub}</p>
              </div>

              <ScrollArea className="h-[420px]">
                {groups.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full bg-muted/50 p-5 ring-8 ring-muted/20">
                      {search ? <Search className="h-9 w-9 text-muted-foreground/40" /> : <Inbox className="h-9 w-9 text-muted-foreground/40" />}
                    </div>
                    <p className="font-semibold text-foreground">{search ? "No matches" : "No records"}</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {search ? "Try a different search term." : `No ${tab.label.toLowerCase()} for this yard in the selected period.`}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                      <TableRow className="hover:bg-transparent border-b border-muted-foreground/10">
                        <TableHead className="w-16 text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">ID</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Customer</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Phone</TableHead>
                        <TableHead className="w-28 text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
                        {showDir && <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Direction</TableHead>}
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Disposition</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Agent</TableHead>
                        <TableHead className="w-24 text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Date</TableHead>
                        <TableHead className="w-16 text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:last-child]:border-0">
                      {groups.map((group, gi) => {
                        const latest = group.tickets[0];
                        const older = group.tickets.slice(1);
                        const isExp = Boolean(expanded[group.key]);

                        const rowData = (t: Ticket, isOlder = false, idx = 0) => (
                          <>
                            <TableCell className="font-mono text-xs">
                              <span className="rounded bg-muted/50 px-1.5 py-0.5 text-muted-foreground ring-1 ring-border">#{t.id}</span>
                            </TableCell>
                            <TableCell className={cn("max-w-[180px] truncate text-sm", isOlder ? "text-muted-foreground" : "font-semibold text-foreground")}>
                              {group.customerLabel}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{group.phoneLabel}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-semibold border", statusColor(t.status))}>
                                {fmtLabel(t.status)}
                              </Badge>
                            </TableCell>
                            {showDir && (
                              <TableCell className="text-xs font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <ArrowRight className={cn("h-3 w-3", normDir(t.direction) === "INBOUND" ? "text-emerald-500" : normDir(t.direction) === "MISSED" ? "text-red-500" : "text-amber-500")} />
                                  {fmtLabel(t.direction)}
                                </span>
                              </TableCell>
                            )}
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-xs ring-1 ring-border">
                                {fmtLabel(t.disposition)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[130px] truncate">
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3 shrink-0" />
                                {agentLabel(t)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {fmtDate(t.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {t.notes?.trim() ? (
                                <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => setNoteTicket(t)}>
                                  <FileText className="h-3 w-3 mr-1" /> View
                                </Button>
                              ) : (
                                <span className="text-muted-foreground/40 italic">—</span>
                              )}
                            </TableCell>
                          </>
                        );

                        return (
                          <Fragment key={`${activeTab}-${group.key}`}>
                            <TableRow className={cn("transition-colors hover:bg-primary/5", gi % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                              {rowData(latest)}
                            </TableRow>
                            {older.length > 0 && !isExp && (
                              <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={showDir ? 9 : 8} className="py-0 pb-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(group.key)}
                                    className="ml-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                    {older.length} more record{older.length !== 1 ? "s" : ""}
                                  </button>
                                </TableCell>
                              </TableRow>
                            )}
                            {isExp && older.map((t, oi) => (
                              <TableRow key={`${group.key}-${t.id}`} className="bg-slate-50/80 dark:bg-slate-900/30">
                                {rowData(t, true, oi)}
                              </TableRow>
                            ))}
                            {isExp && (
                              <TableRow className="hover:bg-transparent border-0">
                                <TableCell colSpan={showDir ? 9 : 8} className="py-0 pb-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(group.key)}
                                    className="ml-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronDown className="h-3 w-3 rotate-180" />
                                    Collapse
                                  </button>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>

              <div className="border-t bg-muted/20 px-4 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{groups.length}</span> customer{groups.length !== 1 ? "s" : ""}
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  <span className="font-semibold text-foreground">{filtered.length}</span> {tab.label.toLowerCase()}
                  {search && " matching search"}
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Notes dialog */}
      <Dialog open={!!noteTicket} onOpenChange={(o) => { if (!o) setNoteTicket(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="h-4 w-4 text-primary" /> Notes
            </DialogTitle>
            <DialogDescription className="text-xs">
              {noteTicket ? `Record #${noteTicket.id}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {noteTicket?.notes || "No notes."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
