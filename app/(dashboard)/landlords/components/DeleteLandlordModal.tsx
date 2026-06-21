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
import { Building2, Loader2, Trash2 } from "lucide-react";
import { LandlordMark } from "./LandlordMark";

interface DeleteLandlordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlordName?: string;
  yardCount?: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeleteLandlordModal({
  open,
  onOpenChange,
  landlordName,
  yardCount = 0,
  isSubmitting,
  onConfirm,
}: DeleteLandlordModalProps) {
  const displayName = landlordName?.trim() || "this landlord";
  const yards = yardCount ?? 0;
  const hasYards = yards > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[480px] dark:border-neutral-800 dark:bg-neutral-950"
      >
        <DialogHeader className="border-b border-slate-100 px-5 py-5 text-center sm:px-6 sm:text-center dark:border-neutral-800">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-[16px] font-semibold leading-tight text-slate-950 dark:text-neutral-50">
                Delete landlord
              </DialogTitle>
              <DialogDescription className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-slate-500 dark:text-neutral-400">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
            <LandlordMark className="h-10 w-10" iconClassName="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Landlord to delete
              </p>
              <p className="mt-1 wrap-anywhere text-[14px] font-semibold leading-snug text-slate-900 dark:text-neutral-100">
                {displayName}
              </p>
            </div>
          </div>

          {hasYards ? (
            <div
              className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 text-center dark:border-amber-900/40 dark:bg-amber-950/30"
              role="alert"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/80 bg-white text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                <Building2 className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-amber-950 dark:text-amber-100">
                Linked yards will be unassigned
              </p>
              <p className="mt-1 text-center text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                This landlord is linked to{" "}
                <span className="font-semibold">{yards}</span> yard
                {yards === 1 ? "" : "s"}. Deleting will remove the landlord
                record; yards will need a new assignment.
              </p>
            </div>
          ) : (
            <p className="text-center text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
              You are about to remove this landlord from the system. Make sure
              you no longer need this contact before continuing.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-neutral-800 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "h-11 rounded-lg px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60",
              "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
            )}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Deleting..." : "Delete landlord"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
