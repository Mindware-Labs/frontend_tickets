"use client";

import {
  Ban,
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  Shield,
  Trash2,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "../types";
import {
  formatLastLogin,
  getUserFullName,
  getUserInitials,
} from "../utils";
import { UserMark } from "./UserMark";

function getRoleAccessLabel(role: User["role"]) {
  return role === "admin" ? "Administrator access" : "Agent workspace access";
}

function RolePill({ role }: { role: User["role"] }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold",
        isAdmin
          ? "border-[#008f68]/20 bg-[#f0faf5] text-[#007a5a] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
      )}
    >
      {isAdmin ? (
        <Shield className="size-3 shrink-0" strokeWidth={2.25} />
      ) : (
        <UserCog className="size-3 shrink-0" strokeWidth={2.25} />
      )}
      {isAdmin ? "Admin" : "Agent"}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-500/15 dark:text-slate-400">
      <span className="size-1.5 shrink-0 rounded-full bg-slate-400" />
      Blocked
    </span>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[58px] min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5",
        accent
          ? "border-[#008f68]/15 bg-[#f0faf5]/70 dark:border-emerald-500/25 dark:bg-emerald-500/10"
          : "border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm dark:bg-slate-950",
          accent
            ? "border-[#008f68]/15 text-[#008f68] dark:border-emerald-500/25 dark:text-emerald-300"
            : "border-slate-200/80 text-slate-400 dark:border-slate-700",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-xs font-semibold text-slate-700 dark:text-slate-200"
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserCard({
  user,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserCardProps) {
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const lastLogin = formatLastLogin(user.lastLogin);
  const accessLabel = getRoleAccessLabel(user.role);

  return (
    <article
      className={cn(
        "group relative flex min-h-[268px] flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200",
        "border-slate-200/80 hover:-translate-y-0.5 hover:border-[#008f68]/35 hover:shadow-[0_12px_32px_rgba(0,111,80,0.12)]",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30",
        !user.isActive && "opacity-[0.92]",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          user.isActive
            ? "bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
            : "bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700",
        )}
      />

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <UserMark
            initials={initials}
            className="size-11 rounded-xl text-[13px]"
            textClassName="text-[13px] tracking-wide"
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Team member
                </p>
                <h3
                  className="mt-1 truncate text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-50"
                  title={fullName}
                >
                  {fullName}
                </h3>
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                #{user.id}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <RolePill role={user.role} />
              <StatusPill active={user.isActive} />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <DetailTile icon={Mail} label="Email" value={user.email} />
          <div className="grid gap-2 sm:grid-cols-2">
            <DetailTile icon={Clock} label="Last login" value={lastLogin} accent />
            <DetailTile icon={Shield} label="Permissions" value={accessLabel} />
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Actions
        </span>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            title="Edit user"
            aria-label="Edit user"
            onClick={() => onEdit(user)}
            className="flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/10"
          >
            <Pencil className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            title={user.isActive ? "Block access" : "Activate user"}
            aria-label={user.isActive ? "Block access" : "Activate user"}
            onClick={() => onToggleStatus(user)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
              user.isActive
                ? "text-slate-400 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                : "text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/10",
            )}
          >
            {user.isActive ? (
              <Ban className="size-4" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="size-4" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            title="Delete user"
            aria-label="Delete user"
            onClick={() => onDelete(user)}
            className="flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:border-red-500/20 dark:hover:bg-red-500/10"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
