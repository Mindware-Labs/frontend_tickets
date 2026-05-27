import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Yards",
  description: "Yard and location directory and management.",
};

export default function YardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
