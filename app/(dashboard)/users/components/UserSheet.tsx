"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Ban,
  CheckCircle2,
  Code2,
  Clock,
  Mail,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { cn } from "@/lib/utils";
import type { User } from "../types";
import {
  formatLastLogin,
  getUserFullName,
  getUserInitials,
} from "../utils";
import { UserMark } from "./UserMark";

interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onEdit?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onDelete?: (user: User) => void;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

export function UserSheet({
  open,
  onOpenChange,
  user,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserSheetProps) {
  const { setSheetOpen } = useAircall();
  const [detail, setDetail] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!user?.id) {
      setDetail(null);
      return;
    }

    setDetail(user);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/users/${user.id}`);
        if (!cancelled) setDetail(fetched);
      } catch {
        if (!cancelled) setDetail(user);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const data = detail || user;
  const fullName = data ? getUserFullName(data) : "";
  const isAdmin = data?.role === "admin";
  const isDev = data?.role === "dev";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh w-full max-w-[520px] flex-col gap-0 overflow-hidden p-0 sm:w-[min(520px,calc(100vw-2rem))]",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900",
          "shadow-2xl shadow-slate-900/15 antialiased dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        )}
      >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>User details</SheetTitle>
              <SheetDescription>No user selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a team member from the grid.
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{fullName}</SheetTitle>
              <SheetDescription>Team member profile and access.</SheetDescription>
            </SheetHeader>

            <div className="relative shrink-0 border-b border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950">
              <SheetClose
                aria-label="Close user details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4 pr-12">
                  <UserMark
                    initials={getUserInitials(data)}
                    className="h-14 w-14 rounded-2xl text-[18px]"
                    textClassName="text-[18px]"
                  />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-[22px] font-bold leading-tight text-slate-950 dark:text-white">
                      {fullName}
                    </h2>
                    <p className="mt-1 truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      {data.email}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 shadow-sm",
                      data.isActive
                        ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                      Status
                    </p>
                    <p className="mt-1 text-[14px] font-bold">
                      {data.isActive ? "Active" : "Blocked"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 shadow-sm",
                      isAdmin
                        ? "border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15"
                        : isDev
                          ? "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15"
                        : "border-blue-200/80 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                      Role
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[14px] font-bold">
                      {isAdmin ? (
                        <Shield className="h-4 w-4" strokeWidth={2} />
                      ) : isDev ? (
                        <Code2 className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <UserCog className="h-4 w-4" strokeWidth={2} />
                      )}
                      {isAdmin ? "Admin" : isDev ? "Dev" : "Agent"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <div>
                  <SectionLabel>Contact</SectionLabel>
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                        <Mail className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Email
                        </p>
                        <a
                          href={`mailto:${data.email}`}
                          className="mt-0.5 block truncate text-[13px] font-semibold text-[#008f68] underline-offset-2 hover:underline dark:text-emerald-300"
                        >
                          {data.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Activity</SectionLabel>
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]">
                        <Clock className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Last login
                        </p>
                        <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-100">
                          {formatLastLogin(data.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!data.isActive ? (
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                    This account is blocked and cannot sign in until reactivated.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2.2} />
                    Edit
                  </button>
                ) : null}
                {onToggleStatus ? (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleStatus(data);
                    }}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-all active:scale-[0.98]",
                      data.isActive
                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
                    )}
                  >
                    {data.isActive ? (
                      <Ban className="h-4 w-4" strokeWidth={2.2} />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                    )}
                    {data.isActive ? "Block" : "Activate"}
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onDelete(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 transition-all hover:bg-red-100/80 active:scale-[0.98] dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
