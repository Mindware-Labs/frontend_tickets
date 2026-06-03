import type React from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { RoleProvider } from "@/components/providers/role-provider";
import { AircallProvider } from "@/components/providers/AircallProvider";
import { TokenExpiryWatcher } from "@/components/providers/TokenExpiryWatcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AircallProvider>
        <TokenExpiryWatcher />
        <DashboardLayout>{children}</DashboardLayout>
      </AircallProvider>
    </RoleProvider>
  );
}
