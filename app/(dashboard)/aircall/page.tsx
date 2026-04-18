"use client";

import { useEffect, useRef } from "react";
import { useAircall } from "@/components/providers/AircallProvider";

/**
 * Full-screen Aircall view. While this route is mounted, the global
 * AircallProvider switches the softphone panel into fullscreen mode and
 * portals the SDK iframe into the container below, so it fills the content
 * area while the dashboard sidebar and topbar stay visible. On unmount we
 * restore the floating dock so the phone is still reachable from anywhere.
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
      className="relative -mx-6 lg:-mx-8 -mb-6 lg:-mb-8 min-h-[calc(100vh-4rem)] overflow-hidden"
    />
  );
}
