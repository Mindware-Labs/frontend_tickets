import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/** Landlord icon — same User mark used in the sidebar. */
export function LandlordMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]",
        className,
      )}
      aria-hidden
    >
      <User
        className={cn("h-4 w-4", iconClassName)}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
