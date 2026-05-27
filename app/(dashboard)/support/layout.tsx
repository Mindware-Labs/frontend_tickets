import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Support",
  description: "Help resources and support documentation.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
