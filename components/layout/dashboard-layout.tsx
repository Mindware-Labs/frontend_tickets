"use client";

import * as React from "react";
import { AppSidebar } from "./sidebar";
import Topbar from "./topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CallSocketProvider } from "@/components/providers/CallSocketProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CallSocketProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#f4f5f7] dark:bg-slate-950">
          <Topbar />
          <main className="flex-1 px-4 pb-6 pt-3 sm:px-6 lg:px-8 lg:pb-8 lg:pt-4">
            {children}
          </main>
        </SidebarInset>
      </CallSocketProvider>
    </SidebarProvider>
  );
}
