"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";

export function OverdueCallsBanner() {
  const { notifications } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  const overdueNotifs = notifications.filter(
    (n) => n.type === "CALLBACK_OVERDUE" && !n.read,
  );

  if (dismissed || overdueNotifs.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-300 mb-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      <p className="flex-1 font-medium">
        <strong>{overdueNotifs.length}</strong> callback
        {overdueNotifs.length === 1 ? "" : "s"} overdue — please follow up as
        soon as possible.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:text-red-700 dark:hover:text-red-200"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
