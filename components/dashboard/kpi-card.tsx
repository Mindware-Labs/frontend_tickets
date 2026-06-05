import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import type { ComponentType } from "react"

interface KPICardProps {
  title: string
  value: string | number
  secondaryValue?: string
  icon: ComponentType<{ className?: string }>
  iconBg: string
  trend?: string
  trendUp?: boolean
}

export default function KPICard({
  title,
  value,
  secondaryValue,
  icon: Icon,
  iconBg,
  trend,
  trendUp
}: KPICardProps) {
  return (
    <Card className="kpi-card-modern border-none group">
      <div className="flex justify-between items-start">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${iconBg} bg-opacity-15 ring-1 ring-inset ring-white/10 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
              <Icon className={`h-5 w-5 ${iconBg.replace("bg-", "text-")}`} />
            </div>
            {trend && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {trend}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground/80 tracking-wide uppercase">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground heading-gradient">{value}</span>
            </div>
            {secondaryValue && (
              <p className="text-xs text-muted-foreground font-medium">{secondaryValue}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
