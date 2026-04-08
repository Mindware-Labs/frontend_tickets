import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Users",
  description: "System user administration.",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
