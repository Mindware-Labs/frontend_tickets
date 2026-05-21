"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallRecordingPlayerProps {
  callId: number | string;
  durationSec?: number | null;
  variant?: "default" | "compact";
  className?: string;
}

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function buildWaveHeights(seed: number, bars: number) {
  return Array.from({ length: bars }, (_, i) => {
    const n =
      Math.sin(i * 0.43 + seed * 0.07) * 0.5 +
      Math.sin(i * 1.1 + seed * 0.13) * 0.3 +
      Math.sin(i * 2.7 + seed * 0.03) * 0.2;
    return Math.max(0.08, Math.min(1, Math.abs(n)));
  });
}

export function CallRecordingPlayer({
  callId,
  durationSec = null,
  variant = "default",
  className,
}: CallRecordingPlayerProps) {
  const compact = variant === "compact";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const numericId = typeof callId === "number" ? callId : parseInt(String(callId), 10);
  const waveBars = compact ? 48 : 60;
  const waveHeights = useMemo(
    () => buildWaveHeights(Number.isFinite(numericId) ? numericId : 1, waveBars),
    [numericId, waveBars],
  );

  const { effectiveDuration, played } = useMemo(() => {
    const eff = audioDuration ?? durationSec ?? null;
    return {
      effectiveDuration: eff,
      played: eff && eff > 0 ? audioCurrentTime / eff : 0,
    };
  }, [audioDuration, audioCurrentTime, durationSec]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadRecording() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(null);

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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Recording unavailable"));
    }
  };

  const seekTo = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !effectiveDuration) return;
    audio.currentTime = ratio * effectiveDuration;
    setAudioCurrentTime(audio.currentTime);
  };

  const recordingHref = `/api/calls/${callId}/recording`;

  const header = compact ? (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#008f68]/10">
        <Mic className="h-3 w-3 text-[#008f68]" />
      </div>
      <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Recording
      </span>
      {effectiveDuration != null ? (
        <span className="font-mono text-[10px] tabular-nums text-slate-400">
          {fmtTime(effectiveDuration)}
        </span>
      ) : durationSec != null ? (
        <span className="font-mono text-[10px] tabular-nums text-slate-400">
          {fmtTime(durationSec)}
        </span>
      ) : null}
    </div>
  ) : null;

  const bodyPadding = compact ? "px-3 py-2.5" : "p-0";

  if (loading) {
    return (
      <div
        className={cn(
          compact &&
            "overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-950",
          className,
        )}
      >
        {header}
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-slate-500",
            bodyPadding,
          )}
        >
          <Loader2 className="h-3 w-3 animate-spin text-[#008f68]" />
          Loading recording…
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        className={cn(
          compact &&
            "overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-950",
          className,
        )}
      >
        {header}
        <div className={cn(bodyPadding)}>
          {compact ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
              <Mic className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <p className="text-[11px] font-medium text-slate-500">
                Recording unavailable
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Recording unavailable</p>
          )}
        </div>
      </div>
    );
  }

  const waveHeight = compact ? 28 : 40;

  const player = (
    <>
      <svg
        className={cn("w-full cursor-pointer", compact ? "mb-2" : "mb-3")}
        height={waveHeight}
        preserveAspectRatio="none"
        viewBox={`0 0 ${waveHeights.length * 6} ${waveHeight}`}
        onClick={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          seekTo((e.clientX - rect.left) / rect.width);
        }}
        aria-hidden
      >
        {waveHeights.map((amp, i) => {
          const x = i * 6 + 1.5;
          const barH = Math.max(2, amp * (waveHeight - 6));
          const y = (waveHeight - barH) / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={3}
              height={barH}
              rx={1.5}
              fill={i / waveHeights.length < played ? "#008f68" : "#e2e8f0"}
            />
          );
        })}
      </svg>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[#008f68] text-white shadow-sm transition-all hover:bg-[#007a5a] active:scale-95",
            compact ? "h-8 w-8" : "h-10 w-10",
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
            </svg>
          ) : (
            <svg
              className="ml-0.5 h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="mb-1 h-1.5 cursor-pointer overflow-hidden rounded-full bg-slate-100"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full rounded-full bg-[#008f68] transition-all"
              style={{ width: `${played * 100}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[10px] tabular-nums text-slate-400">
              {fmtTime(audioCurrentTime)}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-slate-400">
              {effectiveDuration != null ? fmtTime(effectiveDuration) : "—:--"}
            </span>
          </div>
        </div>

        <a
          href={recordingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          title="Open recording"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <audio
        ref={audioRef}
        src={blobUrl}
        preload="metadata"
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setAudioCurrentTime(0);
        }}
        onTimeUpdate={(e) =>
          setAudioCurrentTime((e.currentTarget as HTMLAudioElement).currentTime)
        }
        onLoadedMetadata={(e) =>
          setAudioDuration((e.currentTarget as HTMLAudioElement).duration)
        }
        onError={() => {
          setError("Recording unavailable");
          setIsPlaying(false);
        }}
      />
    </>
  );

  if (compact) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-950",
          className,
        )}
      >
        {header}
        <div className={bodyPadding}>{player}</div>
      </div>
    );
  }

  return <div className={cn("w-full", className)}>{player}</div>;
}
