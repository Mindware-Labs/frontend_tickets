import Image from "next/image";

import { cn } from "@/lib/utils";

/** Official Center Quest mark — cropped from brand assets for crisp sidebar display. */
export function CenterQuestMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/cq-mark.png"
        alt="Center Quest"
        width={size * 2}
        height={size * 2}
        className="h-full w-full object-contain"
        sizes={`${size}px`}
        priority
      />
    </span>
  );
}
