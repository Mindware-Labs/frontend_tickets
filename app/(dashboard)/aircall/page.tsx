"use client";

import { useEffect, useRef } from "react";
import { useAircall } from "@/components/providers/AircallProvider";
import { appPanelClass } from "@/components/layout/sidebar-theme";
import { cn } from "@/lib/utils";

/**
 * Full-screen Aircall view. While this route is mounted, the global
 * AircallProvider switches the softphone panel into fullscreen mode and
 * portals the SDK iframe into the container below, so it fills the content
 * area while the dashboard sidebar and topbar stay visible. On unmount we
 * restore the floating dock so the phone is still reachable from anywhere.
 *
 * Visual shell follows DESIGN_SYSTEM.md §5.2 (panel) and §6 (app shell):
 * the iframe lives inside a rounded white card that aligns with every other
 * dashboard page, instead of bleeding edge-to-edge with negative margins.
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
    <div
      ref={containerRef}
      className={cn(
        appPanelClass,
        // Fill the viewport minus topbar (h-12 + pt-3 = 60px) and main padding
        // (pt-2 + pb-6/lg:pb-8 ≈ 32–40px). 7rem leaves a safe gutter so the
        // softphone never overflows the canvas on short screens.
        "relative h-[calc(100dvh-7rem)] min-h-[480px]",
      )}
    />
  );
}
