const STORAGE_PREFIX = "rh-report-session::";
export const REPORT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface ReportSnapshot<S = unknown> {
  /** URL query string (without the leading "?"). */
  search: string;
  /** Opaque page-defined blob for state that isn't reflected in the URL. */
  state?: S;
  /** Epoch ms when the snapshot was last written. */
  savedAt: number;
}

const isBrowser = () => typeof window !== "undefined";

const storageKey = (scope: string) => STORAGE_PREFIX + scope;

export function readReportSnapshot<S = unknown>(
  scope: string,
  ttlMs: number = REPORT_SESSION_TTL_MS,
): ReportSnapshot<S> | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const snap = JSON.parse(raw) as ReportSnapshot<S>;
    if (
      !snap ||
      typeof snap.savedAt !== "number" ||
      Date.now() - snap.savedAt > ttlMs
    ) {
      sessionStorage.removeItem(storageKey(scope));
      return null;
    }
    return snap;
  } catch {
    try {
      sessionStorage.removeItem(storageKey(scope));
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeReportSnapshot<S = unknown>(
  scope: string,
  search: string,
  state?: S,
): void {
  if (!isBrowser()) return;
  try {
    const snap: ReportSnapshot<S> = {
      search: search || "",
      state,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(storageKey(scope), JSON.stringify(snap));
  } catch {
    /* sessionStorage may be unavailable in private browsing — ignore. */
  }
}

/** Drops the snapshot for `scope` if any. */
export function clearReportSnapshot(scope: string): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(storageKey(scope));
  } catch {
    /* ignore */
  }
}

/** True when the snapshot has any persisted URL or state worth restoring. */
export function snapshotHasContent<S>(snap: ReportSnapshot<S> | null): boolean {
  if (!snap) return false;
  if (snap.search && snap.search.length > 0) return true;
  if (snap.state === undefined || snap.state === null) return false;
  if (typeof snap.state === "object") {
    return Object.keys(snap.state as Record<string, unknown>).length > 0;
  }
  return true;
}
