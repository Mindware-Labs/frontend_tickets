import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Landlords",
  description: "Landlord directory and relationship management.",
};

export default function LandlordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
