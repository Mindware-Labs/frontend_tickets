"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import { getUserFullName, getUserInitials } from "../utils";
import { UserMark } from "./UserMark";
import type { User } from "../types";

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteUserModal({
  open,
  onOpenChange,
  user,
  isSubmitting,
  onConfirm,
}: DeleteUserModalProps) {
  const displayName = user ? getUserFullName(user) : "this user";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[480px] dark:border-neutral-800 dark:bg-neutral-950"
      >
        <DialogHeader className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-neutral-800">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 space-y-1.5 text-left pt-0.5">
              <DialogTitle className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-neutral-50">
                Delete user
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-slate-500 dark:text-neutral-400">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
              <UserMark
                initials={getUserInitials(user)}
                className="h-10 w-10 text-[14px]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  User to delete
                </p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-slate-900 dark:text-neutral-100">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-neutral-400">
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}

          <p className="text-justify text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
            The member will lose access immediately. Historical records may
            still reference this account.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 dark:border-neutral-800 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "h-10 rounded-lg px-6 text-sm font-semibold shadow-sm disabled:opacity-60",
              "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Deleting..." : "Delete user"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
