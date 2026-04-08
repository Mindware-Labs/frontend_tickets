import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customer directory and management.",
};

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
