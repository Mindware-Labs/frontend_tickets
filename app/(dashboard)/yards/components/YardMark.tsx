import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Yard icon — same Building2 mark used in the sidebar and yard forms. */
export function YardMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
        className,
      )}
      aria-hidden
    >
      <Building2
        className={cn("h-4 w-4", iconClassName)}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
