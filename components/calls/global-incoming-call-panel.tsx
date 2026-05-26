"use client";

/**
 * Global incoming-call panel.
 *
 * Subscribes to Aircall SDK events through the AircallProvider pub/sub
 * and renders the IncomingCallModal anywhere in the app whenever the
 * agent is making or receiving a call.
 *
 * Lifecycle:
 *  - `incoming_call`     → opens panel in INBOUND / RINGING state.
 *  - `outgoing_call`     → opens panel in OUTBOUND / RINGING state.
 *  - `outgoing_answered`
 *    or `call_end_ringtone` → transitions to ACTIVE (answeredAt = now).
 *  - `call_ended`        → transitions to ENDED. Panel stays visible for a
 *                          short follow-up window so the agent can still
 *                          create a ticket, then auto-dismisses.
 *
 * Customer lookup is best-effort: we resolve the caller by phone number
 * using `/customers?search=…` and then fetch the full profile + timeline.
 * If nothing matches, the panel renders in "Unknown caller" mode.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AircallEndedCallPayload,
  AircallIncomingCallPayload,
  AircallOutgoingCallPayload,
} from "aircall-everywhere";

import { useAircall } from "@/components/providers/AircallProvider";

import { IncomingCallModal } from "./incoming-call-modal";
import {
  fetchCustomerByPhone,
  fetchCustomerProfile,
} from "./incoming-call-modal-api";
import type {
  CallDirection,
  CallState,
  CustomerProfile,
} from "./incoming-call-modal-types";

/** How long the panel sticks around after the call ended (ms). */
const POST_CALL_LINGER_MS = 90_000;

interface ActiveCall {
  direction: CallDirection;
  state: CallState;
  /** Phone number on the other end (raw, as Aircall reports it). */
  phone: string;
  /** Aircall call id (when available) — used to ignore duplicate events. */
  callId?: number;
  /** Optional Aircall-provided contact name (fallback when no DB match). */
  contactNameFromSdk?: string;
  startedAt: string;
  answeredAt?: string;
}

export function GlobalIncomingCallPanel() {
  const { on, isLoggedIn } = useAircall();
  const router = useRouter();

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [open, setOpen] = useState(false);

  /**
   * Token bumps on every new call so any in-flight customer lookups
   * from a previous call can detect they're stale before applying their
   * result. Avoids "wrong customer flashes when calls overlap".
   */
  const lookupTokenRef = useRef(0);
  /** Auto-dismiss timer for the post-call linger window. */
  const linger = useRef<number | null>(null);

  const clearLinger = useCallback(() => {
    if (linger.current !== null) {
      window.clearTimeout(linger.current);
      linger.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearLinger();
    linger.current = window.setTimeout(() => {
      setOpen(false);
      setActiveCall(null);
      setCustomer(null);
    }, POST_CALL_LINGER_MS);
  }, [clearLinger]);

  /**
   * Kick off the customer lookup for a freshly opened call. Bumps the
   * lookup token so any concurrent older lookup is dropped.
   */
  const loadCustomer = useCallback(async (phone: string) => {
    lookupTokenRef.current += 1;
    const token = lookupTokenRef.current;
    setCustomer(null);
    if (!phone) return;
    try {
      const match = await fetchCustomerByPhone(phone);
      if (token !== lookupTokenRef.current) return; // stale
      if (!match) {
        setCustomer(null);
        return;
      }
      const profile = await fetchCustomerProfile(match.id);
      if (token !== lookupTokenRef.current) return; // stale
      setCustomer(profile);
    } catch {
      if (token === lookupTokenRef.current) setCustomer(null);
    }
  }, []);

  // ── Subscribe to Aircall events ────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const offIncoming = on<AircallIncomingCallPayload>(
      "incoming_call",
      (data) => {
        const phone = (data.from || "").trim();
        const contactNameFromSdk = data.contact
          ? [data.contact.first_name, data.contact.last_name]
              .filter(Boolean)
              .join(" ") || data.contact.company_name || undefined
          : undefined;
        clearLinger();
        setActiveCall({
          direction: "INBOUND",
          state: "RINGING",
          phone,
          callId: data.call_id,
          contactNameFromSdk,
          startedAt: new Date().toISOString(),
        });
        setOpen(true);
        void loadCustomer(phone);
      },
    );

    const offOutgoing = on<AircallOutgoingCallPayload>(
      "outgoing_call",
      (data) => {
        // Some SDK builds expose the destination as `to`, others as
        // `phone_number` — accept both.
        const phone = String(
          data.to ??
            (data as { phone_number?: string }).phone_number ??
            "",
        ).trim();
        clearLinger();
        setActiveCall({
          direction: "OUTBOUND",
          state: "RINGING",
          phone,
          callId: data.call_id,
          startedAt: new Date().toISOString(),
        });
        setOpen(true);
        void loadCustomer(phone);
      },
    );

    const markAnswered = () => {
      setActiveCall((prev) =>
        prev && prev.state === "RINGING"
          ? {
              ...prev,
              state: "ACTIVE",
              answeredAt: new Date().toISOString(),
            }
          : prev,
      );
    };

    const offAnswered = on("outgoing_answered", markAnswered);
    // call_end_ringtone fires when the inbound ringtone stops (typically
    // because the agent picked up).
    const offEndRing = on("call_end_ringtone", markAnswered);

    const offEnded = on<AircallEndedCallPayload>("call_ended", () => {
      setActiveCall((prev) => (prev ? { ...prev, state: "ENDED" } : prev));
      scheduleDismiss();
    });

    return () => {
      offIncoming();
      offOutgoing();
      offAnswered();
      offEndRing();
      offEnded();
    };
  }, [on, isLoggedIn, loadCustomer, scheduleDismiss, clearLinger]);

  // Cleanup any pending linger timer on unmount.
  useEffect(() => () => clearLinger(), [clearLinger]);

  if (!activeCall) return null;

  // Synthesise a minimal CustomerProfile when we couldn't find a DB match
  // but Aircall gave us a contact name — gives the agent at least something
  // to look at instead of "Unknown caller".
  const effectiveCustomer: CustomerProfile | null =
    customer ??
    (activeCall.contactNameFromSdk
      ? {
          id: -1,
          name: activeCall.contactNameFromSdk,
          phone: activeCall.phone,
          customerSince: activeCall.startedAt,
          flags: [],
          yards: [],
          campaigns: [],
          notes: [],
          stats: {
            totalCalls: 0,
            totalTickets: 0,
            openTickets: 0,
            legacyTickets: 0,
            manualRecords: 0,
          },
          calls: [],
          tickets: [],
          manualRecords: [],
        }
      : null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // User dismissed mid-call: clear any linger timer and drop state so
      // the panel doesn't pop back open on a delayed `call_ended`.
      clearLinger();
      setActiveCall(null);
      setCustomer(null);
    }
  };

  const handleOpenProfile = () => {
    if (customer?.id && customer.id > 0) {
      router.push(`/customers?id=${customer.id}`);
    }
  };

  const handleCreateTicket = () => {
    if (customer?.id && customer.id > 0) {
      router.push(`/calls?customerId=${customer.id}&tab=tickets`);
    } else {
      router.push("/calls");
    }
  };

  return (
    <IncomingCallModal
      open={open}
      onOpenChange={handleOpenChange}
      customer={effectiveCustomer}
      call={{
        direction: activeCall.direction,
        state: activeCall.state,
        startedAt: activeCall.startedAt,
        answeredAt: activeCall.answeredAt,
      }}
      onOpenProfile={handleOpenProfile}
      onCreateTicket={handleCreateTicket}
      position="bottom-right"
    />
  );
}

export default GlobalIncomingCallPanel;
