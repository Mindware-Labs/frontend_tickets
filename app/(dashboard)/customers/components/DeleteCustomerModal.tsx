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
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { CustomerMark } from "./CustomerMark";

interface DeleteCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName?: string;
  customerPhone?: string;
  ticketCount?: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteCustomerModal({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  ticketCount,
  isSubmitting,
  onConfirm,
}: DeleteCustomerModalProps) {
  const displayName = customerName?.trim() || "this customer";
  const activities = ticketCount ?? 0;

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
                Delete customer
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-slate-500 dark:text-neutral-400">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
            <CustomerMark className="h-10 w-10" iconClassName="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Customer to delete
              </p>
              <p className="mt-1 text-[14px] font-semibold leading-snug text-slate-900 dark:text-neutral-100">
                {displayName}
              </p>
              {customerPhone ? (
                <p className="mt-0.5 font-mono text-[12px] text-slate-500 dark:text-neutral-400">
                  {customerPhone}
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-justify text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
            You are about to remove this customer from active lists. Linked call
            and ticket history will remain available in their modules.
          </p>

          {activities > 0 ? (
            <div
              className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 text-center dark:border-amber-900/40 dark:bg-amber-950/30"
              role="alert"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/80 bg-white text-amber-600 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-amber-950 dark:text-amber-100">
                Linked activity will be preserved
              </p>
              <p className="mt-2 text-justify text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                This customer has <span className="font-semibold">{activities}</span>{" "}
                linked activit{activities === 1 ? "y" : "ies"}. The customer is
                soft-deleted only.
              </p>
              <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <ActivitiesIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {activities} activit{activities === 1 ? "y" : "ies"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 dark:border-neutral-800 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
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
            {isSubmitting ? "Deleting..." : "Delete customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
