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
import { AlertTriangle, Loader2, Ticket, Trash2 } from "lucide-react";
import { YardMark } from "./YardMark";

interface DeleteYardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardName?: string;
  ticketCount?: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteYardModal({
  open,
  onOpenChange,
  yardName,
  ticketCount,
  isSubmitting,
  onConfirm,
}: DeleteYardModalProps) {
  const displayName = yardName?.trim() || "this yard";
  const tickets = ticketCount ?? 0;
  const hasTickets = tickets > 0;
  const canDelete = !hasTickets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[480px] dark:border-slate-800 dark:bg-slate-950"
      >
        {/* HEADER MEJORADO: Tipografía y proporciones pulidas */}
        <DialogHeader className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 space-y-1.5 text-left pt-0.5">
              <DialogTitle className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Delete yard
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <YardMark className="h-10 w-10" iconClassName="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Yard to delete
              </p>
              <p className="mt-1 wrap-anywhere text-[14px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
            </div>
          </div>

          {canDelete ? (
            <p className="text-justify text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              You are about to remove this yard from the system. All linked
              configuration will be cleared. Make sure you no longer need this
              location before continuing.
            </p>
          ) : (
            <div
              className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 text-center dark:border-amber-900/40 dark:bg-amber-950/30"
              role="alert"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/80 bg-white text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-amber-950 dark:text-amber-100">
                Cannot delete this yard
              </p>
              <p className="mt-2 text-justify text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                This yard has <span className="font-semibold">{tickets}</span>{" "}
                linked ticket
                {tickets === 1 ? "" : "s"}. Deactivate the yard instead of
                deleting it.
              </p>
              <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Ticket className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {tickets} ticket{tickets === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting || !canDelete}
            className={cn(
              "h-10 rounded-lg px-6 text-sm font-semibold shadow-sm disabled:opacity-60",
              "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Deleting..." : "Delete yard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
