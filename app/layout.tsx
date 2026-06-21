import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Rig Hut Support Center",
    template: "%s | Rig Hut",
  },
  description:
    "Support ticket management system for tracking, managing, and resolving customer inquiries across campaigns, yards, and phone lines.",
  openGraph: {
    title: "Rig Hut Support Center",
    description:
      "Support ticket management system for tracking, managing, and resolving customer inquiries across campaigns, yards, and phone lines.",
    url: "/",
    siteName: "Rig Hut Support Center",
    images: [
      {
        url: "/apple-icon.png",
        width: 180,
        height: 180,
        alt: "Rig Hut",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rig Hut Support Center",
    description:
      "Support ticket management system for tracking, managing, and resolving customer inquiries across campaigns, yards, and phone lines.",
    images: ["/apple-icon.png"],
  },
  icons: {
    icon: "/images/LOGO CQ-10.png",
    shortcut: "/images/LOGO CQ-10.png",
    apple: "/images/LOGO CQ-10.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans font-medium antialiased tracking-tight`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
