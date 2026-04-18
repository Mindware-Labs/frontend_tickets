import type React from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { RoleProvider } from "@/components/providers/role-provider";
import { AircallProvider } from "@/components/providers/AircallProvider";

// Auth is handled by middleware.ts — no client-side check needed here.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AircallProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </AircallProvider>
    </RoleProvider>
  );
}
