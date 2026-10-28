import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/dashboard/category-display'
import { computeDonutSegments } from '@/lib/dashboard/donut'
import { categoryBreakdown, type ApplicationStats } from '@/lib/dashboard/stats'

interface StatusDonutChartProps {
  stats: ApplicationStats
}

export function StatusDonutChart({ stats }: StatusDonutChartProps) {
  const breakdown = categoryBreakdown(stats)
  const segments = computeDonutSegments(breakdown)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Breakdown</CardTitle>
        <CardDescription>Where your applications stand</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-[30px]">
        <div className="relative size-[140px] shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r="54" fill="none" strokeWidth="20" className="stroke-border" />
            {segments.map((segment) => (
              <circle
                key={segment.category}
                cx="70"
                cy="70"
                r="54"
                fill="none"
                strokeWidth="20"
                strokeLinecap="round"
                stroke={CATEGORY_COLORS[segment.category]}
                strokeDasharray={segment.dasharray}
                strokeDashoffset={segment.dashoffset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[28px] font-bold">{stats.total}</span>
            <span className="text-xs text-muted-foreground">Applications</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {breakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-[10px] text-[13px]">
              <span
                className="size-3 rounded-[4px]"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              />
              <span>
                {CATEGORY_LABELS[item.category]} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
