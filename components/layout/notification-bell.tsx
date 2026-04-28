"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
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

const typeConfig: Record<
  NotificationItem["type"],
  {
    icon: React.ElementType;
    bg: string;
    color: string;
    border: string;
    label: string;
  }
> = {
  CALLBACK_OVERDUE: {
    icon: Phone,
    bg: "bg-red-100",
    color: "text-red-600",
    border: "border-red-400",
    label: "Overdue",
  },
  TICKET_FOLLOWUP_OVERDUE: {
    icon: Ticket,
    bg: "bg-orange-100",
    color: "text-orange-600",
    border: "border-orange-400",
    label: "Follow-up",
  },
  CALLBACK_REMINDER: {
    icon: Clock,
    bg: "bg-amber-100",
    color: "text-amber-600",
    border: "border-amber-400",
    label: "Reminder",
  },
  TICKET_ASSIGNED: {
    icon: Ticket,
    bg: "bg-blue-100",
    color: "text-blue-600",
    border: "border-blue-400",
    label: "Assigned",
  },
};

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
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(400px,calc(100vw-12px))] p-0 shadow-2xl rounded-2xl border border-slate-200/80 overflow-hidden bg-white"
      >
        {/* Header */}
        <div className="relative px-5 pt-4 pb-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
                <Bell className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 leading-none">
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#008f68]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[min(460px,60svh)]">
          {listLoading ? (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 px-5 py-4 animate-pulse"
                >
                  <div className="mt-0.5 h-9 w-9 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 bg-slate-100 rounded-full w-2/3" />
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                    <div className="h-2 bg-slate-100 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3.5 py-14 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <BellOff className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  All caught up
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  No new notifications right now
                </p>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notif) => {
                const cfg =
                  typeConfig[notif.type] ?? typeConfig.CALLBACK_REMINDER;
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`group relative flex w-full items-start gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 ${
                      !notif.read ? "bg-slate-50/80" : ""
                    }`}
                  >
                    {/* Unread left bar */}
                    {!notif.read && (
                      <span
                        className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${cfg.border} border-l-2`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative mt-0.5 shrink-0 flex items-center justify-center h-9 w-9 rounded-xl ${cfg.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      {!notif.read && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#008f68] ring-1 ring-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[13px] leading-snug text-slate-700 font-medium">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <ArrowRight className="mt-2.5 h-3.5 w-3.5 text-slate-300 shrink-0 translate-x-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {!listLoading && notifications.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-2.5 flex items-center justify-center">
            <span className="text-[11px] text-slate-400">
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""} · Showing latest
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
