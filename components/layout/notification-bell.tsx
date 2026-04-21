"use client";

import * as React from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Ticket,
  BellOff,
  ArrowRight,
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const typeConfig: Record<
  NotificationItem["type"],
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  CALLBACK_OVERDUE: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
    label: "Overdue",
  },
  TICKET_FOLLOWUP_OVERDUE: {
    icon: Ticket,
    bg: "bg-orange-100 dark:bg-orange-900/30",
    color: "text-orange-600 dark:text-orange-400",
    label: "Follow-up",
  },
  CALLBACK_REMINDER: {
    icon: Clock,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600 dark:text-amber-400",
    label: "Reminder",
  },
  TICKET_ASSIGNED: {
    icon: Ticket,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
    label: "Assigned",
  },
};

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount, notifications, listLoading, markRead, markAllRead } =
    useNotifications();

  const handleClick = (notif: NotificationItem) => {
    markRead(notif.id);
    if (notif.ticketId) {
      router.push(`/tickets?id=${notif.ticketId}`);
    } else if (notif.callId) {
      router.push(`/tickets?id=${notif.callId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-24px))] p-0 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[11px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-[#008f68] dark:hover:text-emerald-400 font-medium transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-90">
          {listLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3.5 animate-pulse"
                >
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800">
                <BellOff className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  All caught up
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  No new notifications
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notif) => {
                const cfg =
                  typeConfig[notif.type] ?? typeConfig.CALLBACK_REMINDER;
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !notif.read
                        ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                        : ""
                    }`}
                  >
                    {/* Icon container */}
                    <div
                      className={`mt-0.5 shrink-0 flex items-center justify-center h-8 w-8 rounded-lg ${cfg.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-full ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#008f68] shrink-0" />
                        )}
                      </div>
                      <p className="text-[13px] leading-snug text-slate-700 dark:text-slate-200">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <ArrowRight className="mt-2 h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {!listLoading && notifications.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""} · Showing latest
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
