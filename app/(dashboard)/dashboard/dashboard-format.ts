export function formatDuration(seconds?: number | null): string {
  const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes) return `${hours}h ${remainingMinutes}m`;
  return `${hours}h`;
}

/** Cap live queue waits so stale sessions never show multi-day waits. */
export function sanitizeLiveQueueWaitSeconds(seconds?: number | null): number {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  return Math.min(value, 2 * 60 * 60);
}

export function formatLiveQueueTrend(
  queuedCount: number,
  longestSeconds?: number | null,
): string {
  if (!queuedCount) return "No callers waiting right now";
  const wait = sanitizeLiveQueueWaitSeconds(longestSeconds);
  if (!wait) return `${queuedCount} in queue`;
  return `Longest wait · ${formatDuration(wait)} (${queuedCount} waiting)`;
}
