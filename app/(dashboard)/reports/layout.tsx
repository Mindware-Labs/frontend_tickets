import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Reports",
  description: "Reports and statistics for the support center.",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
