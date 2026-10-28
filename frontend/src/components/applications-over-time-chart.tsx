import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationsOverTimeQueryOptions } from '@/lib/dashboard/applications-over-time'
import { getChartTicks } from '@/lib/dashboard/chart-ticks'

function formatWeekLabel(
  weekStart: string,
  locale: string = navigator.language,
): string {
  return new Date(weekStart).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function ApplicationsOverTimeChart() {
  const query = useQuery(applicationsOverTimeQueryOptions)

  const maxCount = query.isSuccess
    ? Math.max(0, ...query.data.map((bucket) => bucket.count))
    : 0
  const ticks = getChartTicks(maxCount)
  const ceiling = ticks[0]

  return (
    <Card className="flex h-[420px] flex-col">
      <CardHeader>
        <CardTitle>Applications Over Time</CardTitle>
        <CardDescription>
          Applications created per week, last 12 weeks
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        {query.isPending && (
          <div className="flex h-full items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-full w-full" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="text-sm text-destructive">
            Couldn't load your applications-over-time data. Try refreshing the
            page.
          </p>
        )}

        {query.isSuccess && (
          <div className="flex min-h-0 flex-1">
            <div className="flex flex-col justify-between pr-3 text-right text-xs text-muted-foreground">
              {ticks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="flex flex-1 items-end gap-2 border-l border-border pl-3">
              {query.data.map((bucket) => (
                <div
                  key={bucket.weekStart}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    data-slot="chart-bar"
                    className="w-full max-w-10 rounded-t-lg bg-gradient-to-b from-primary/70 to-primary"
                    style={{
                      height: `${Math.round((bucket.count / ceiling) * 100)}%`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formatWeekLabel(bucket.weekStart)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
