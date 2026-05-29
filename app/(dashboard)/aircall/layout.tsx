import type { Metadata } from "next";
import type React from "react";

const title = "Aircall";
const description =
  "Aircall softphone — make and receive calls without leaving the support center.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: "/images/cq-mark.png",
        width: 512,
        height: 512,
        alt: "Center Quest",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/images/cq-mark.png"],
  },
};

export default function AircallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
