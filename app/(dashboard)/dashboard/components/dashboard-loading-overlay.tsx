"use client";

import { useEffect, useState } from "react";

import { EntityLoadingSpinner } from "@/components/shared/entity-loading-state";
import { cn } from "@/lib/utils";

type DashboardLoadingOverlayProps = {
  show: boolean;
  className?: string;
};

export function DashboardLoadingOverlay({
  show,
  className,
}: DashboardLoadingOverlayProps) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(timeout);
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center rounded-xl",
        "bg-[#f4f5f7]/85 backdrop-blur-[3px] dark:bg-neutral-900/85",
        "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={show}
      aria-label="Loading dashboard charts"
    >
      <div
        className={cn(
          "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          visible ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
      >
        <EntityLoadingSpinner
          kind="dashboard"
          size="lg"
          label="Loading dashboard charts"
          className="rounded-2xl border border-slate-200/80 bg-white/90 px-8 py-7 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/90"
        />
      </div>
    </div>
  );
}
