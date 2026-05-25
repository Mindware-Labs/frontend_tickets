"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  readReportSnapshot,
  snapshotHasContent,
  writeReportSnapshot,
  type ReportSnapshot,
} from "@/lib/report-session-cache";

interface UseReportSessionOptions<S> {
  /**
   * Stable identifier for this report (e.g. `"reports/yards"`). Used as the
   * sessionStorage key — must be unique per page.
   */
  scope: string;
  /**
   * `true` when the page just mounted with no useful URL filters (i.e. a bare
   * `/reports/yards`). Only in this case do we restore a saved snapshot.
   * The check is left to the caller because every page picks "what counts"
   * differently (yardId vs campaignId vs landlordId, etc.).
   */
  isUrlBare: boolean;
  /**
   * Current URL search string to persist. Pass the result of
   * `searchParams.toString()` (without leading "?"). If empty AND `state` is
   * also empty, the snapshot is overwritten with empty content so a previously
   * cleared report doesn't get restored.
   */
  searchString: string;
  /**
   * Opaque blob for state that lives outside the URL (chart cross-filters,
   * date pickers held only in component state, etc.). Optional.
   */
  state?: S;
  /**
   * Called once, synchronously inside the restore effect, with the saved
   * `state` blob from sessionStorage so the page can hydrate non-URL values.
   * Receives `undefined` if the snapshot didn't include a state blob.
   */
  onRestoreState?: (state: S | undefined) => void;
  /**
   * `false` to disable restore + persist completely (e.g. while bootstrapping
   * data dependencies). Defaults to `true`.
   */
  enabled?: boolean;
}

/**
 * Restore + persist a report's "where I left off" state in `sessionStorage`.
 *
 * Restore happens **once on mount** and only when the URL is bare. We
 * `router.replace` to the saved URL so the existing URL → state effects in
 * each page can hydrate filters, dates, fetch data, etc. Any non-URL state
 * is delivered through `onRestoreState`.
 *
 * Persist runs on every change of `searchString` / `state` while enabled.
 */
export function useReportSession<S = unknown>({
  scope,
  isUrlBare,
  searchString,
  state,
  onRestoreState,
  enabled = true,
}: UseReportSessionOptions<S>): void {
  const router = useRouter();
  const pathname = usePathname();
  const restoredRef = useRef(false);
  // Latest callback ref so we don't re-trigger restore when callers pass an
  // inline arrow function that changes on every render.
  const onRestoreStateRef = useRef(onRestoreState);
  onRestoreStateRef.current = onRestoreState;

  // ── Restore on first mount ──────────────────────────────────────────────
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (!enabled) return;
    if (!isUrlBare) return;

    const snap: ReportSnapshot<S> | null = readReportSnapshot<S>(scope);
    if (!snap || !snapshotHasContent(snap)) return;

    if (snap.state !== undefined && onRestoreStateRef.current) {
      try {
        onRestoreStateRef.current(snap.state);
      } catch {
        /* swallow consumer errors so URL replace still happens */
      }
    }

    if (snap.search) {
      const sep = snap.search.startsWith("?") ? "" : "?";
      router.replace(`${pathname}${sep}${snap.search}`, { scroll: false });
    }
    // Intentionally only run on mount; deps captured once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist whenever URL or extra state changes ─────────────────────────
  // We serialise `state` for the dependency array so React detects deep
  // changes without forcing callers to memoise the object.
  const stateKey = state === undefined ? "" : JSON.stringify(state);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    // Avoid clobbering a still-valid snapshot during the brief window before
    // the restore effect has run.
    if (!restoredRef.current) return;
    writeReportSnapshot(scope, searchString, state);
    // `state` itself is captured through stateKey for change-detection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, searchString, stateKey]);
}
