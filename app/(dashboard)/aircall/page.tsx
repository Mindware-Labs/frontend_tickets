"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAircall } from "@/components/providers/AircallProvider";
import { CenterQuestMark } from "@/components/layout/center-quest-mark";
import { appPanelClass } from "@/components/layout/sidebar-theme";
import { cn } from "@/lib/utils";

/**
 * Full-screen Aircall view. While this route is mounted, the global
 * AircallProvider switches the softphone panel into fullscreen mode and
 * portals the SDK iframe into the container below, so it fills the content
 * area while the dashboard sidebar and topbar stay visible. On unmount we
 * restore the floating dock so the phone is still reachable from anywhere.
 *
 */

export default function AircallPage() {
  const { setMountMode, setFullscreenContainer } = useAircall();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMountMode("fullscreen");
    setFullscreenContainer(containerRef.current);
    return () => {
      setFullscreenContainer(null);
      setMountMode("dock");
    };
  }, [setMountMode, setFullscreenContainer]);

  return (
    // Fill the viewport minus topbar (h-12 + pt-3 = 60px) and main padding
    // (pt-2 + pb-6/lg:pb-8 ≈ 32–40px). 7rem leaves a safe gutter so the
    // softphone never overflows the canvas on short screens.
    <div className="flex h-[calc(100dvh-7rem)] min-h-[480px] flex-col gap-2">
      {/* Branded header — same Center Quest logo lockup as the sidebar. */}
      <div
        className={cn(
          appPanelClass,
          "relative flex shrink-0 items-center gap-3 px-3.5 py-2",
        )}
      >
        {/* Top accent line — matches the app topbar (DESIGN_SYSTEM §5.3). */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
          aria-hidden
        />
        <span className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25"
          title="Center Quest"
        >
          <CenterQuestMark size={26} />
          <span
            className="hidden size-7 shrink-0 items-center justify-center rounded-lg bg-[#008f68] text-[11px] font-bold text-white dark:inline-flex"
            aria-hidden
          >
            CQ
          </span>
          <span className="truncate text-[14px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Center Quest
          </span>
        </Link>
        <div className="ml-auto min-w-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Softphone
          </p>
          <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            Aircall
          </p>
        </div>
      </div>

      {/* Softphone container — the AircallProvider portals the SDK panel here. */}
      <div ref={containerRef} className={cn(appPanelClass, "relative min-h-0 flex-1")} />
    </div>
  );
}
