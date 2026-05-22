"use client";

import { DashboardPageHeader } from "./components/dashboard-page-header";
import { DashboardTabs } from "./components/dashboard-tabs";
import { DashboardDataProvider } from "./use-dashboard-real-data";

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <div className="flex h-[calc(100dvh-5.5rem)] flex-col gap-0 px-4 pb-4 pt-2">
        <DashboardPageHeader />
        <DashboardTabs />
      </div>
    </DashboardDataProvider>
  );
}
