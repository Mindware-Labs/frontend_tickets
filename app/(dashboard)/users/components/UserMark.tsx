import { cn } from "@/lib/utils";

export function UserMark({
  initials,
  className,
  textClassName,
}: {
  initials: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-gradient-to-br from-[#f0faf5] to-white font-bold text-[#008f68] shadow-sm",
        className,
      )}
      aria-hidden
    >
      <span className={cn("select-none", textClassName)}>{initials}</span>
    </div>
  );
}
