import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Phone Lines",
  description: "Phone line management.",
};

export default function PhoneLinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
