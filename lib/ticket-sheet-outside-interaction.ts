/**
 * Radix Sheet (Dialog) dismisses on outside pointer/focus unless prevented.
 * Ticket drawers use portaled peek panels, popovers, and selects — treat those
 * as "inside" so follow-up pickers and Log update do not close the sheet.
 */
const ALLOWED_OUTSIDE_SELECTORS = [
  "[data-aircall-fab='true']",
  "[data-aircall-panel='true']",
  "[data-peek-panel='true']",
  "[data-ticket-log-update-panel='true']",
  "[data-ticket-sheet-overlay='true']",
  "[data-slot='popover-content']",
  "[data-slot='select-content']",
  "[data-slot='dropdown-menu-content']",
  "[data-radix-popper-content-wrapper]",
] as const;

export function isTicketSheetOutsideTarget(
  target: EventTarget | null | undefined,
): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return ALLOWED_OUTSIDE_SELECTORS.some((sel) => !!target.closest(sel));
}

function getHTMLElementFromNativeEvent(event: Event): HTMLElement | null {
  if (typeof event.composedPath === "function") {
    for (const node of event.composedPath()) {
      if (node instanceof HTMLElement) return node;
    }
  }
  if (event.target instanceof HTMLElement) return event.target;
  return null;
}

export function getSheetOutsideEventTarget(event: {
  target: EventTarget | null;
  detail?: { originalEvent?: Event };
}): HTMLElement | null {
  const original = event.detail?.originalEvent;
  if (original) {
    const fromOriginal = getHTMLElementFromNativeEvent(original);
    if (fromOriginal) return fromOriginal;
  }
  if (event.target instanceof HTMLElement) return event.target;
  return null;
}

export function shouldIgnoreTicketSheetOutsideEvent(event: {
  target: EventTarget | null;
  detail?: { originalEvent?: Event };
}): boolean {
  return isTicketSheetOutsideTarget(getSheetOutsideEventTarget(event));
}
