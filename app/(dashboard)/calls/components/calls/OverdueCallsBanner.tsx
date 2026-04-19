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
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      <p className="flex-1">
        <strong>{overdueNotifs.length}</strong> callback
        {overdueNotifs.length === 1 ? "" : "s"} overdue — please follow up as
        soon as possible.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
