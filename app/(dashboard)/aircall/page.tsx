"use client";

import { useEffect } from "react";
import { Loader2, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAircall } from "@/components/providers/AircallProvider";

export default function AircallPage() {
  const { status, isLoggedIn, agent, errorMessage, openDock } = useAircall();

  // Auto-open the dock when this page is entered so users get the iframe in sight.
  useEffect(() => {
    openDock();
  }, [openDock]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        {status === "loading" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        )}
        {status === "ready" && isLoggedIn && (
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        )}
        {status === "ready" && !isLoggedIn && (
          <Phone className="h-10 w-10 text-amber-600" />
        )}
        {status === "error" && (
          <AlertTriangle className="h-10 w-10 text-destructive" />
        )}
      </div>

      <div className="text-center max-w-lg space-y-2">
        {status === "loading" && (
          <>
            <h2 className="text-lg font-semibold">Loading Aircall…</h2>
            <p className="text-sm text-muted-foreground">
              We are getting the softphone ready. This only takes a few seconds.
            </p>
          </>
        )}
        {status === "ready" && isLoggedIn && (
          <>
            <h2 className="text-lg font-semibold">
              Aircall ready — {agent?.firstName} {agent?.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              The phone is available in the floating dock. You can make calls
              from any page of the dashboard and you will receive incoming calls
              even when you are not on this view.
            </p>
          </>
        )}
        {status === "ready" && !isLoggedIn && (
          <>
            <h2 className="text-lg font-semibold">Sign in to Aircall</h2>
            <p className="text-sm text-muted-foreground">
              Open the dock and use your Aircall credentials. Once signed in,
              you will be able to call from the tickets list with a single
              click.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-lg font-semibold text-destructive">
              Failed to load Aircall
            </h2>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "Check your connection and try again."}
            </p>
          </>
        )}
      </div>

      <Button onClick={openDock}>
        <Phone className="mr-2 h-4 w-4" />
        Open phone
      </Button>
    </div>
  );
}
