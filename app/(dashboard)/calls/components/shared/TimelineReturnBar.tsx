"use client";

import { ArrowLeft } from "lucide-react";

export function TimelineReturnBar({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <div className="border-b border-[#008f68]/15 bg-[#f0faf5] dark:bg-emerald-950/30 dark:border-emerald-900/30 px-4 py-2.5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#008f68]/25 bg-white dark:bg-neutral-900 dark:border-emerald-800/40 px-3 py-2 text-left text-[12px] font-semibold text-[#008f68] dark:text-emerald-400 shadow-sm transition-colors hover:border-[#008f68]/45 hover:bg-[#e8faf0] dark:hover:bg-emerald-950/50"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
