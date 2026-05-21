import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampaignMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-gradient-to-br from-[#f0faf5] to-white text-[#008f68] shadow-sm",
        className,
      )}
      aria-hidden
    >
      <Megaphone
        className={cn("h-4 w-4", iconClassName)}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
