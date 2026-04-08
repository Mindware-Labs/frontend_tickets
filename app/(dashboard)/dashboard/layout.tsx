import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Main panel with metrics and KPIs for the support center.",
};

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
