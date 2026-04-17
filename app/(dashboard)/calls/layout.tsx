import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Management and tracking of support tickets.",
};

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
