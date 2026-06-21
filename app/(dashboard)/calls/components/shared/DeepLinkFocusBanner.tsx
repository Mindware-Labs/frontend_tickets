"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeepLinkFocusBanner({
  entityLabel,
  entityId,
  onClear,
}: {
  entityLabel: string;
  entityId: string | number;
  onClear: () => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#008f68]/25 bg-[#f0faf5] dark:bg-neutral-800/50 px-3 py-2 text-[12px] text-slate-700 dark:text-neutral-200">
      <p className="min-w-0 flex-1 leading-snug">
        Showing {entityLabel}{" "}
        <span className="font-mono font-bold text-[#008f68]">#{entityId}</span>{" "}
        only — use Clear to reset filters and see all items, or use back in the
        panel.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onClear}
        className="h-7 shrink-0 border-[#008f68]/30 bg-white dark:bg-neutral-900 px-2.5 text-[11px] font-semibold text-[#008f68] hover:bg-[#e8f8f1] dark:hover:bg-neutral-800"
      >
        <X className="mr-1 h-3 w-3" />
        Clear
      </Button>
    </div>
  );
}
