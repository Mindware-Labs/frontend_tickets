import type React from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { RoleProvider } from "@/components/providers/role-provider";

// Auth is handled by middleware.ts — no client-side check needed here.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleProvider>
  );
}
