"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface CallRecordingPlayerProps {
  callId: number | string;
  className?: string;
}

export function CallRecordingPlayer({
  callId,
  className = "w-full h-10",
}: CallRecordingPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadRecording() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      try {
        const res = await fetch(
          `/api/calls/${callId}/recording?t=${Date.now()}`,
          { credentials: "include", cache: "no-store" },
        );

        if (cancelled) return;

        if (!res.ok) {
          const text = await res.text();
          setError(text || `HTTP ${res.status}`);
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          setError("Recording unavailable");
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setError("Failed to load recording");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecording();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [callId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading recording…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Recording unavailable
      </p>
    );
  }

  if (!blobUrl) return null;

  return (
    <audio
      ref={audioRef}
      controls
      preload="metadata"
      className={className}
      src={blobUrl}
    >
      Your browser does not support audio playback.
    </audio>
  );
}
