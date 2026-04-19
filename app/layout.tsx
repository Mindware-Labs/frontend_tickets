import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Rig Hut Call Center",
    template: "%s | Rig Hut",
  },
  description: "Call Center Call Management System",
  icons: {
    icon: "/images/LOGO CQ-01.png",
    apple: "/images/LOGO CQ-01.png",
  },
  openGraph: {
    title: "Rig Hut Support Center",
    description: "Call Center Call Management System",
    images: [
      {
        url: "/images/LOGO CQ-01.png",
        width: 512,
        height: 512,
        alt: "Rig Hut Logo",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans font-medium antialiased tracking-tight">
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
