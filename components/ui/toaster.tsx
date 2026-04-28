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
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

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
        const isDestructive = variant === "destructive";
        const iconBg = isDestructive ? "bg-red-100" : "bg-green-100";
        const resolvedIcon =
          icon ||
          (isDestructive ? (
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
          ) : variant === "default" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Info className="h-3.5 w-3.5 text-blue-500" />
          ));

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
              >
                {resolvedIcon}
              </span>
              <div className="flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
