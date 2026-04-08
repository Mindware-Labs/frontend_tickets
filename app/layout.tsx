import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RoleProvider } from "@/components/providers/role-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
// 1. IMPORTAR EL COMPONENTE
import { TicketSocketProvider } from "@/components/providers/TicketSocketProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Rig Hut Support Center",
    template: "%s | Rig Hut",
  },
  description: "Call Center Ticket Management System",
  icons: {
    icon: "/images/LOGO CQ-01.png",
    apple: "/images/LOGO CQ-01.png",
  },
  openGraph: {
    title: "Rig Hut Support Center",
    description: "Call Center Ticket Management System",
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
    <RoleProvider>
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 2. AGREGARLO AQUÍ (antes de children) */}
            <TicketSocketProvider />

            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </RoleProvider>
  );
}
