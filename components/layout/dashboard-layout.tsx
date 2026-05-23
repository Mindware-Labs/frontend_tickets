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
          <main className="flex-1 px-3 pb-6 pt-2 sm:px-4 lg:px-5 lg:pb-8">
            {children}
          </main>
        </SidebarInset>
      </CallSocketProvider>
    </SidebarProvider>
  );
}
