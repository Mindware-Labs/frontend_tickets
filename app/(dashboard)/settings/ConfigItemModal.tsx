"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const inputClass =
  "h-9 w-full rounded-lg border border-transparent bg-slate-50 px-2.5 text-xs text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 dark:bg-neutral-800 dark:text-neutral-100";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  initialLabel: string;
  isEditing: boolean;
  submitting: boolean;
  onSave: (value: string, label: string) => void;
}

export function ConfigItemModal({
  open,
  onOpenChange,
  title,
  initialValue,
  initialLabel,
  isEditing,
  submitting,
  onSave,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setLabel(initialLabel);
    }
  }, [open, initialValue, initialLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave(value.trim().toUpperCase().replace(/\s+/g, "_"), label.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-sm">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-neutral-50">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="bg-[#f4f5f7] px-5 py-4 dark:bg-neutral-900/60">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
              <div className="space-y-3 px-4 py-4">
                {!isEditing && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Internal key{" "}
                      <span className="normal-case font-normal text-slate-400">
                        (UPPER_SNAKE_CASE)
                      </span>
                    </p>
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="e.g. MY_VALUE"
                      className={cn(inputClass, "font-mono")}
                      required
                      autoFocus={!isEditing}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Display label{" "}
                    <span className="normal-case text-red-400">*</span>
                  </p>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. My Label"
                    className={inputClass}
                    required
                    autoFocus={isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !label.trim()}
              className="h-9 rounded-lg bg-[#008f68] px-5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a5a] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
