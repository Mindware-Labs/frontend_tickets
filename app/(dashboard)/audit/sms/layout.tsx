import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "SMS Audit",
  description:
    "Audit and review SMS conversations across phone lines, agents, and customers.",
};

export default function SmsAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
