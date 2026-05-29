import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Notifications Audit",
  description:
    "Audit log of notification deliveries — track delivery channels, read receipts, and response latency across agents.",
};

export default function NotificationsAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
