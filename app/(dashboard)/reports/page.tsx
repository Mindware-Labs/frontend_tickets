"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker"
import { Download, PieChart, LineChart } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze performance and export data for external review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker />
          <Button variant="outline" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agent-performance">Agent Performance</TabsTrigger>
          <TabsTrigger value="campaign-roi">Campaign ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6 rounded-xl border border-border/50 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Tickets</h3>
              <div className="text-2xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Resolution Time</h3>
              <div className="text-2xl font-bold">4h 12m</div>
              <p className="text-xs text-emerald-500 font-medium">-15m improvement</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">CSAT Score</h3>
              <div className="text-2xl font-bold text-emerald-600">4.8/5</div>
              <p className="text-xs text-muted-foreground">Based on 450 ratings</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-border/50 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">SLA Breach Rate</h3>
              <div className="text-2xl font-bold text-rose-600">2.1%</div>
              <p className="text-xs text-muted-foreground">Target: &lt; 5%</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ticket Volume Trends</CardTitle>
                <CardDescription>Daily ticket intake vs resolved over past 30 days.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center bg-secondary/10 rounded-lg border border-dashed border-border">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <LineChart className="h-10 w-10 opacity-20" />
                    <span className="text-sm">Chart Placeholder (Recharts integration here)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ticket Sources</CardTitle>
                <CardDescription>Distribution of ticket origin channels.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-secondary/10 rounded-lg border border-dashed border-border">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PieChart className="h-10 w-10 opacity-20" />
                    <span className="text-sm">Chart Placeholder</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
