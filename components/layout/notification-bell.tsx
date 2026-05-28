"use client";

import * as React from "react";
import { mutate as globalMutate } from "swr";
import {
  Bell,
  CheckCheck,
  Clock,
  Ticket,
  BellOff,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  type NotificationItem,
} from "@/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { topbarIconBtnClass } from "@/components/layout/sidebar-theme";
import { cn } from "@/lib/utils";

// ─── Type → DS-aligned palette (DESIGN_SYSTEM §10.4 / §10.6) ──────────────
type NotificationToneClasses = {
  icon: React.ElementType;
  /** Soft tinted surface for the icon square + label chip. */
  surface: string;
  /** Foreground colour pairing with `surface`. */
  text: string;
  /** Accent dot / unread bar colour (saturated). */
  accent: string;
  /** Short uppercase chip label. */
  label: string;
};

const typeConfig: Record<NotificationItem["type"], NotificationToneClasses> = {
  CALLBACK_OVERDUE: {
    icon: Phone,
    surface: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500",
    label: "Overdue",
  },
  TICKET_FOLLOWUP_OVERDUE: {
    icon: Ticket,
    surface: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    accent: "bg-amber-500",
    label: "Follow-up",
  },
  CALLBACK_REMINDER: {
    icon: Clock,
    surface: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    accent: "bg-sky-500",
    label: "Reminder",
  },
  TICKET_ASSIGNED: {
    icon: Ticket,
    surface: "bg-[#f0faf5] dark:bg-emerald-500/10",
    text: "text-[#008f68] dark:text-emerald-400",
    accent: "bg-[#008f68] dark:bg-emerald-400",
    label: "Assigned",
  },
  SCHEDULED_CALL_DUE: {
    icon: Clock,
    surface: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    accent: "bg-indigo-500",
    label: "Call Now",
  },
};

const FALLBACK_TONE = typeConfig.CALLBACK_REMINDER;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { unreadCount, notifications, listLoading, markRead, markAllRead } =
    useNotifications();

  const handleClick = (notif: NotificationItem) => {
    markRead(notif.id);
    setOpen(false);
    if (notif.ticketId) {
      router.push(`/calls?id=${notif.ticketId}`);
    } else if (notif.callId) {
      router.push(`/calls?id=${notif.callId}`);
    } else if (notif.scheduleCallId) {
      router.push(`/calls`);
    }
  };

  const handleMarkRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notif: NotificationItem,
  ) => {
    event.stopPropagation();
    await markRead(notif.id);
  };

  const handleMarkDone = async (
    event: React.MouseEvent<HTMLButtonElement>,
    notif: NotificationItem,
  ) => {
    event.stopPropagation();
    if (!notif.scheduleCallId) {
      await markRead(notif.id);
      return;
    }

    const response = await fetch(`/api/schedule-calls/${notif.scheduleCallId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    const result = await response.json();
    if (!result.success) return;

    await markRead(notif.id);
    globalMutate("/api/schedule-calls?status=PENDING&limit=100");
  };

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(topbarIconBtnClass, "relative")}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white tabular-nums ring-2 ring-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] dark:ring-slate-900"
              aria-hidden
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(400px,calc(100vw-12px))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950"
      >
        {/* ── Header — accent bar + section label + title ── */}
        <div className="relative border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
            aria-hidden
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]"
                aria-hidden
              />
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                <Bell className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "Inbox"}
                </p>
                <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">
                  Notifications
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:border-[#008f68]/25 hover:bg-[#f0faf5] hover:text-[#008f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all
              </button>
            )}
          </div>
        </div>

        {/* ── List ── */}
        <ScrollArea className="max-h-[min(460px,60svh)]">
          {listLoading ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/80">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 animate-pulse"
                >
                  <div className="mt-0.5 size-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2 w-1/3 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                <BellOff className="size-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  All caught up
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  No new notifications right now
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 py-0.5 dark:divide-slate-800/70">
              {notifications.map((notif) => {
                const cfg = typeConfig[notif.type] ?? FALLBACK_TONE;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(notif)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleClick(notif);
                      }
                    }}
                    className={cn(
                      "group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 dark:hover:bg-slate-900/50 dark:focus-visible:bg-slate-900/50",
                      !notif.read && "bg-slate-50/60 dark:bg-slate-900/30",
                    )}
                  >
                    {/* Unread accent rail */}
                    {!notif.read && (
                      <span
                        className={cn(
                          "absolute inset-y-2 left-0 w-0.5 rounded-r-full",
                          cfg.accent,
                        )}
                        aria-hidden
                      />
                    )}

                    {/* Icon tile (DS metric-card pattern) */}
                    <span
                      className={cn(
                        "relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
                        cfg.surface,
                        cfg.text,
                      )}
                      aria-hidden
                    >
                      <Icon className="size-4" />
                      {!notif.read && (
                        <span
                          className={cn(
                            "absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-white dark:ring-slate-950",
                            cfg.accent,
                          )}
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            cfg.surface,
                            cfg.text,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[12.5px] leading-snug text-slate-700 dark:text-slate-200",
                          !notif.read && "font-semibold text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {notif.scheduleCallId ? (
                          <button
                            type="button"
                            onClick={(event) => handleMarkDone(event, notif)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#008f68]/20 bg-[#f0faf5] px-2.5 text-[10.5px] font-semibold text-[#008f68] transition-colors hover:border-[#008f68]/30 hover:bg-[#008f68] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                          >
                            <CheckCheck className="size-3.5" aria-hidden />
                            Done
                          </button>
                        ) : null}

                        {!notif.read ? (
                          <button
                            type="button"
                            onClick={(event) => handleMarkRead(event, notif)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10.5px] font-semibold text-slate-500 transition-colors hover:border-[#008f68]/25 hover:bg-[#f0faf5] hover:text-[#008f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <ArrowRight
                      className="mt-2.5 size-3.5 shrink-0 translate-x-0 text-slate-300 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600"
                      aria-hidden
                    />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ── */}
        {!listLoading && notifications.length > 0 && (
          <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50/40 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/30">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Showing latest {notifications.length}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
