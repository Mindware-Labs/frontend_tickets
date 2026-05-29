"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AircallLoaderProps {
  className?: string;
  size?: "sm" | "md";
}

export function AircallLoader({ className, size = "md" }: AircallLoaderProps) {
  const isSm = size === "sm";
  const dim = isSm ? 36 : 72;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isSm ? "size-9" : "h-full w-full",
        className,
      )}
      aria-label="Loading…"
      role="status"
    >
      <style>{`
        @keyframes ac-pulse {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.08); opacity: 0.82; }
        }
        .ac-pulse {
          animation: ac-pulse 1.35s ease-in-out infinite;
          transform-origin: center;
          display: inline-flex;
        }
      `}</style>

      <span className="ac-pulse">
        <Image
          src="/aircall-logo.png"
          alt="Aircall"
          width={dim}
          height={dim}
          priority
        />
      </span>
    </div>
  );
}
