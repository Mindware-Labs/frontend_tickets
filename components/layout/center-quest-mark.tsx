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
    <>
      {/* Light mode */}
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center dark:hidden",
          className,
        )}
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
      {/* Dark mode — scale up to compensate for whitespace in the source image */}
      <span
        className={cn(
          "relative hidden shrink-0 items-center justify-center overflow-hidden dark:inline-flex",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src="/images/LOGO CQ-12.png"
          alt="Center Quest"
          width={size * 2}
          height={size * 2}
          className="h-full w-full object-contain scale-[2.3]"
          sizes={`${size}px`}
          priority
        />
      </span>
    </>
  );
}
