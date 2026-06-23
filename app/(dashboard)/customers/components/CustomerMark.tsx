import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function CustomerMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68] dark:border-[#008f68]/20 dark:bg-[#008f68]/10 dark:text-[#34d399]",
        className,
      )}
      aria-hidden
    >
      <Users
        className={cn("h-4 w-4", iconClassName)}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
