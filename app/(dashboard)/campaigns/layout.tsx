import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Campaign management and tracking.",
};

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
