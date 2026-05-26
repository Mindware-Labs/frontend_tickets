"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react";

type ToastTone = "default" | "destructive" | "loading" | "info";

const TONE_STYLES: Record<
  ToastTone,
  {
    bg: string;
    icon: string;
    Icon: LucideIcon;
    spin?: boolean;
    eyebrow: string;
    eyebrowColor: string;
  }
> = {
  default: {
    bg: "bg-[#f0faf5] dark:bg-emerald-500/10",
    icon: "text-[#008f68] dark:text-emerald-400",
    Icon: CheckCircle2,
    eyebrow: "Success",
    eyebrowColor: "text-[#008f68] dark:text-emerald-300",
  },
  destructive: {
    bg: "bg-rose-50 dark:bg-rose-500/10",
    icon: "text-rose-600 dark:text-rose-400",
    Icon: AlertCircle,
    eyebrow: "Error",
    eyebrowColor: "text-rose-600 dark:text-rose-300",
  },
  loading: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-300",
    Icon: Loader2,
    spin: true,
    eyebrow: "Working",
    eyebrowColor: "text-amber-700 dark:text-amber-300",
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-500/10",
    icon: "text-sky-600 dark:text-sky-400",
    Icon: Info,
    eyebrow: "Info",
    eyebrowColor: "text-sky-700 dark:text-sky-300",
  },
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        icon,
        variant,
        ...props
      }) {
        const tone: ToastTone =
          variant === "destructive"
            ? "destructive"
            : variant === "loading"
              ? "loading"
              : variant === "info"
                ? "info"
                : "default";
        const palette = TONE_STYLES[tone];
        const ToneIcon = palette.Icon;

        const resolvedIcon = icon ?? (
          <ToneIcon
            className={`h-4 w-4 ${palette.icon} ${palette.spin ? "animate-spin" : ""}`}
            aria-hidden
          />
        );

        return (
          <Toast key={id} variant={variant} {...props}>
            <span
              className={`mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/40 ${palette.bg}`}
            >
              {resolvedIcon}
            </span>
            <div className="min-w-0 flex-1 pr-1">
              <span
                className={`block text-[9px] font-semibold uppercase tracking-[0.16em] ${palette.eyebrowColor}`}
              >
                {palette.eyebrow}
              </span>
              {title && (
                <ToastTitle className="mt-0.5">{title}</ToastTitle>
              )}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action ? <div className="mt-2">{action}</div> : null}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
