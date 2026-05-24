"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TransitionPhase = "idle" | "out" | "in";

const PHASE_CLASS: Record<TransitionPhase, string> = {
  idle: "opacity-100 translate-y-0",
  out: "pointer-events-none opacity-[0.62] translate-y-1",
  in: "opacity-100 translate-y-0",
};

export function YardFilterTransition({
  children,
  isFilterLoading,
}: {
  children: ReactNode;
  isFilterLoading: boolean;
}) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");

  useEffect(() => {
    if (isFilterLoading) {
      setPhase("out");
      return;
    }

    setPhase("in");
    const timeout = window.setTimeout(() => setPhase("idle"), 320);
    return () => window.clearTimeout(timeout);
  }, [isFilterLoading]);

  return (
    <div
      className={cn(
        "h-full will-change-[opacity,transform]",
        "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        PHASE_CLASS[phase],
      )}
    >
      {children}
    </div>
  );
}
