import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/dashboard/category-display'
import { categoryBreakdown, type ApplicationStats } from '@/lib/dashboard/stats'

interface CategoryProgressBarsProps {
  stats: ApplicationStats
}

export function CategoryProgressBars({ stats }: CategoryProgressBarsProps) {
  const breakdown = categoryBreakdown(stats)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Progress</CardTitle>
        <CardDescription>Share of total applications</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {breakdown.map((item) => (
          <div key={item.category}>
            <div className="mb-[10px] flex items-center justify-between">
              <span className="text-sm font-medium">
                {CATEGORY_LABELS[item.category]}
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {item.percentage}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                data-testid={`progress-${item.category}-fill`}
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: CATEGORY_COLORS[item.category],
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
