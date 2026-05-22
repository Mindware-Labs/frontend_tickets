"use client";

import { useCallback, useEffect } from "react";
import { useAircall } from "@/components/providers/AircallProvider";

/**
 * Keeps the Aircall phone panel and ticket peek panels (Log update, call preview)
 * mutually exclusive: opening one closes the other.
 */
export function useTicketPeekAircallExclusion(
  peekOpen: boolean,
  onClosePeek: () => void,
) {
  const { registerCloseTicketPeeks, closeDock } = useAircall();

  const stableClose = useCallback(() => {
    onClosePeek();
  }, [onClosePeek]);

  useEffect(
    () => registerCloseTicketPeeks(stableClose),
    [registerCloseTicketPeeks, stableClose],
  );

  useEffect(() => {
    if (peekOpen) closeDock();
  }, [peekOpen, closeDock]);
}
