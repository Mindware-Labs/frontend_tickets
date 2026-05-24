"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_TOAST_STYLE = {
  right: "calc(min(80svw, 1100px) + 1rem)",
} as const;

export function useSheetAnchoredToasts({
  open,
  showSuccessToast,
  showErrorToast,
  onSuccessToastDismiss,
  onErrorToastDismiss,
  successDurationMs = 3000,
  errorDurationMs = 4000,
}: {
  open: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccessToastDismiss?: () => void;
  onErrorToastDismiss?: () => void;
  successDurationMs?: number;
  errorDurationMs?: number;
}) {
  const [toastActive, setToastActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastUnmountRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errorToastActive, setErrorToastActive] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const errorToastUnmountRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const dismissSuccessToast = useCallback(() => {
    setToastVisible(false);
    if (toastUnmountRef.current) clearTimeout(toastUnmountRef.current);
    toastUnmountRef.current = setTimeout(() => {
      setToastActive(false);
      onSuccessToastDismiss?.();
      toastUnmountRef.current = null;
    }, 300);
  }, [onSuccessToastDismiss]);

  const dismissErrorToast = useCallback(() => {
    setErrorToastVisible(false);
    if (errorToastUnmountRef.current) clearTimeout(errorToastUnmountRef.current);
    errorToastUnmountRef.current = setTimeout(() => {
      setErrorToastActive(false);
      onErrorToastDismiss?.();
      errorToastUnmountRef.current = null;
    }, 300);
  }, [onErrorToastDismiss]);

  useEffect(() => {
    if (!showSuccessToast) {
      setToastVisible(false);
      const unmount = setTimeout(() => setToastActive(false), 300);
      return () => clearTimeout(unmount);
    }
    setToastActive(true);
    setToastVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setToastVisible(true)),
    );
    const dismiss = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setToastActive(false);
        onSuccessToastDismiss?.();
      }, 300);
    }, successDurationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
  }, [showSuccessToast, onSuccessToastDismiss, successDurationMs]);

  useEffect(() => {
    if (!showErrorToast) {
      setErrorToastVisible(false);
      const unmount = setTimeout(() => setErrorToastActive(false), 300);
      return () => clearTimeout(unmount);
    }
    setErrorToastActive(true);
    setErrorToastVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setErrorToastVisible(true)),
    );
    const dismiss = setTimeout(() => {
      setErrorToastVisible(false);
      setTimeout(() => {
        setErrorToastActive(false);
        onErrorToastDismiss?.();
      }, 300);
    }, errorDurationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
  }, [showErrorToast, onErrorToastDismiss, errorDurationMs]);

  const dismissAllToasts = useCallback(() => {
    setToastVisible(false);
    setErrorToastVisible(false);
    if (toastUnmountRef.current) clearTimeout(toastUnmountRef.current);
    if (errorToastUnmountRef.current) clearTimeout(errorToastUnmountRef.current);
    const unmount = setTimeout(() => {
      setToastActive(false);
      setErrorToastActive(false);
      onSuccessToastDismiss?.();
      onErrorToastDismiss?.();
      toastUnmountRef.current = null;
      errorToastUnmountRef.current = null;
    }, 300);
    toastUnmountRef.current = unmount;
    errorToastUnmountRef.current = unmount;
  }, [onSuccessToastDismiss, onErrorToastDismiss]);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      dismissAllToasts();
    }
    prevOpenRef.current = open;
  }, [open, dismissAllToasts]);

  return {
    toastActive,
    toastVisible,
    errorToastActive,
    errorToastVisible,
    dismissSuccessToast,
    dismissErrorToast,
  };
}

export function SheetAnchoredToasts({
  open,
  toastActive,
  toastVisible,
  errorToastActive,
  errorToastVisible,
  onDismissSuccess,
  onDismissError,
  successTitle = "Saved",
  successDescription = "Changes saved successfully",
  errorTitle = "Error",
  errorDescription = "Failed to save changes",
}: {
  open: boolean;
  toastActive: boolean;
  toastVisible: boolean;
  errorToastActive: boolean;
  errorToastVisible: boolean;
  onDismissSuccess: () => void;
  onDismissError: () => void;
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
}) {
  return (
    <>
      {open && errorToastActive && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white rounded-xl border border-slate-200/80",
            "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10),inset_4px_0_0_0_#ef4444]",
            "px-4 py-3 min-w-65 max-w-80",
            "transition-all duration-300 ease-out",
            errorToastVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0",
          )}
          style={{ ...SHEET_TOAST_STYLE, bottom: "4.5rem" }}
        >
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              {errorTitle}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{errorDescription}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onDismissError}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {open && toastActive && (
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white rounded-xl border border-slate-200/80",
            "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10),inset_4px_0_0_0_#22c55e]",
            "px-4 py-3 min-w-65 max-w-80",
            "transition-all duration-300 ease-out",
            toastVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0",
          )}
          style={{ ...SHEET_TOAST_STYLE, bottom: "1rem" }}
        >
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              {successTitle}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {successDescription}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onDismissSuccess}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
}
