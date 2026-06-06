"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  submitting: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ open, onOpenChange, label, submitting, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-sm">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-slate-50">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 dark:bg-red-950/40">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
            Delete item
          </DialogTitle>
        </DialogHeader>

        <div className="bg-[#f4f5f7] px-5 py-4 dark:bg-slate-900/60">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {label}
              </strong>
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="h-9 rounded-lg bg-red-500 px-5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
