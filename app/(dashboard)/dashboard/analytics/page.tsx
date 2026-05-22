"use client";

import { useState, useEffect } from "react";
import KPICard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import BarChart from "@/components/dashboard/bar-chart";
import LineChart from "@/components/dashboard/line-chart";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Activity,
  BarChart2,
  Clock,
  TrendingUp,
  Users,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AnalyticsDashboardData = {
  generatedAt: string;
  kpis: {
    totalCalls: number;
    totalTickets: number;
    activeTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    pendingActions: number;
    resolutionRate: number;
    callsLast7Days: number;
  };
  charts: {
    callsByDay: { day: string; calls: number }[];
    ticketsByCampaign: { name: string; count: number }[];
    ticketsByDisposition: { name: string; count: number }[];
  };
};

const emptyDashboardData: AnalyticsDashboardData = {
  generatedAt: new Date().toISOString(),
  kpis: {
    totalCalls: 0,
    totalTickets: 0,
    activeTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    pendingActions: 0,
    resolutionRate: 0,
    callsLast7Days: 0,
  },
  charts: {
    callsByDay: [
      { day: "Mon", calls: 0 },
      { day: "Tue", calls: 0 },
      { day: "Wed", calls: 0 },
      { day: "Thu", calls: 0 },
      { day: "Fri", calls: 0 },
      { day: "Sat", calls: 0 },
      { day: "Sun", calls: 0 },
    ],
    ticketsByCampaign: [{ name: "No data", count: 0 }],
    ticketsByDisposition: [{ name: "No data", count: 0 }],
  },
};

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState<AnalyticsDashboardData>(emptyDashboardData);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Unable to load analytics data.");
        }
        if (isMounted) setDashboardData(payload.data);
      } catch (error: any) {
        toast.error("Failed to load analytics data.", {
          description: error?.message || "Please try again.",
        });
        if (isMounted) setDashboardData(emptyDashboardData);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const { kpis } = dashboardData;
  const campaignData = dashboardData.charts.ticketsByCampaign;
  const typeData = dashboardData.charts.ticketsByDisposition;
  const callsData = dashboardData.charts.callsByDay;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Analytics Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into performance metrics and operational efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[140px] h-9 bg-background/50 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs font-medium text-muted-foreground border border-border/50">
            <CalendarRange className="h-3.5 w-3.5" />
            <span>Oct 24 - Oct 31, 2024</span>
          </div>

          <Button
            onClick={() => toast.success("Report generated successfully!")}
            className="h-9 btn-primary-modern"
          >
            <BarChart2 className="mr-2 h-3.5 w-3.5" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* --- KPIS --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Calls"
          value={kpis.totalCalls}
          secondaryValue={`${kpis.callsLast7Days} last 7 days`}
          icon={Clock}
          iconBg="bg-blue-500"
          trend="Live data"
          trendUp={true}
        />
        <KPICard
          title="Resolution Rate"
          value={`${kpis.resolutionRate}%`}
          secondaryValue={`${kpis.closedTickets} tickets closed`}
          icon={Activity}
          iconBg="bg-violet-500"
          trend={kpis.resolutionRate >= 80 ? "On target" : "Below target"}
          trendUp={kpis.resolutionRate >= 80}
        />
        <KPICard
          title="Active Tickets"
          value={kpis.activeTickets}
          secondaryValue={`${kpis.openTickets} open, ${kpis.inProgressTickets} in progress`}
          icon={Users}
          iconBg="bg-amber-500"
          trend={`${kpis.totalTickets} total`}
          trendUp={kpis.activeTickets === 0}
        />
        <KPICard
          title="Pending Actions"
          value={kpis.pendingActions}
          secondaryValue="High priority open work"
          icon={TrendingUp}
          iconBg="bg-emerald-500"
          trend={kpis.pendingActions ? "Review" : "Clear"}
          trendUp={kpis.pendingActions === 0}
        />
      </div>

      {/* --- PRIMARY CHARTS --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Inbound Call Volume (7 Days)">
            <LineChart data={callsData} />
          </ChartCard>
        </div>
        <div className="lg:col-span-1">
          <ChartCard title="Call Distribution by Type">
            <BarChart data={typeData} color="oklch(0.65 0.18 160)" />
          </ChartCard>
        </div>
      </div>

      {/* --- DETAILED BREAKDOWN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Campaign Performance Metrics">
          <BarChart data={campaignData} color="var(--color-primary)" />
        </ChartCard>

        <div className="glass-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Top Performing Agents
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-8">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                    A{i}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Agent #{i}00{i}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Senior Support Specialist
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-500">98%</p>
                  <p className="text-[10px] text-muted-foreground">
                    CSAT Score
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
