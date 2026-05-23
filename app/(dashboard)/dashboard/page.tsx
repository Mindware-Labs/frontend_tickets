"use client";

import { DashboardTabs } from "./components/dashboard-tabs";
import { DashboardDataProvider } from "./use-dashboard-real-data";

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <div className="flex h-[calc(100dvh-4.25rem)] min-h-0 flex-col">
        <DashboardTabs />
      </div>
    </DashboardDataProvider>
  );
}
