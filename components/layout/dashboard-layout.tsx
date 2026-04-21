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
        <SidebarInset>
          <Topbar />
          <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8">{children}</main>
        </SidebarInset>
      </CallSocketProvider>
    </SidebarProvider>
  );
}
