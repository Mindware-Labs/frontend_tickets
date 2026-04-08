import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Policies, guides, and reference documentation.",
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
