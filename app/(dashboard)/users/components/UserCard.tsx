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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "../types";
import {
  formatLastLogin,
  getUserFullName,
  getUserInitials,
} from "../utils";
import { UserMark } from "./UserMark";

function RolePill({ role }: { role: User["role"] }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold",
        isAdmin
          ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
      )}
    >
      {isAdmin ? (
        <Shield className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      ) : (
        <UserCog className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      )}
      {isAdmin ? "Admin" : "Agent"}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-[3px] text-[11px] font-semibold text-[#15803d] dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-[3px] text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-500/15 dark:text-slate-400">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      Blocked
    </span>
  );
}

interface UserCardProps {
  user: User;
  onOpen: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserCard({
  user,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserCardProps) {
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(user)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(user);
        }
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200",
        "border-slate-200/80 hover:border-[#008f68]/35 hover:shadow-[0_12px_32px_rgba(0,111,80,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/40 focus-visible:ring-offset-2",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30",
        !user.isActive && "opacity-[0.92]",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          user.isActive
            ? "bg-gradient-to-r from-[#008f68] via-[#00a67a] to-[#007a5a]"
            : "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500",
        )}
      />

      <div className="flex flex-1 flex-col p-4 pt-5">
        <div className="flex items-start gap-3">
          <UserMark
            initials={initials}
            className="h-12 w-12 text-[15px]"
            textClassName="text-[15px]"
          />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                #{user.id}
              </span>
              <RolePill role={user.role} />
            </div>
            <h3
              className="mt-1.5 truncate text-[16px] font-bold leading-tight text-slate-900 dark:text-slate-50"
              title={fullName}
            >
              {fullName}
            </h3>
            <div className="mt-2">
              <StatusPill active={user.isActive} />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Email
              </p>
              <p
                className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-200"
                title={user.email}
              >
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Last login
              </p>
              <p className="truncate text-[12px] font-medium text-slate-600 dark:text-slate-300">
                {formatLastLogin(user.lastLogin)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="Edit user"
          aria-label="Edit user"
          onClick={() => onEdit(user)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          title={user.isActive ? "Block access" : "Activate user"}
          aria-label={user.isActive ? "Block access" : "Activate user"}
          onClick={() => onToggleStatus(user)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            user.isActive
              ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
          )}
        >
          {user.isActive ? (
            <Ban className="h-4 w-4" strokeWidth={2} />
          ) : (
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          title="Delete user"
          aria-label="Delete user"
          onClick={() => onDelete(user)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}
