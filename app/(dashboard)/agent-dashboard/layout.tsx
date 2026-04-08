import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Agent Dashboard",
  description: "Agent panel with tickets and recent activity.",
};

export default function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
