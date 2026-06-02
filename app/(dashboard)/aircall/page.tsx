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
    <div className="flex h-[calc(100dvh-7rem)] min-h-[480px] flex-col">
      {/* Softphone container — the AircallProvider portals the SDK panel here. */}
      <div ref={containerRef} className={cn(appPanelClass, "relative min-h-0 flex-1")} />
    </div>
  );
}
