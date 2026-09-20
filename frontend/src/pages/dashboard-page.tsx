import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'

const SUMMARY_CARDS = [
  { key: 'total', label: 'Total' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'offers', label: 'Offers' },
  { key: 'rejections', label: 'Rejections' },
] as const

export function DashboardPage() {
  const statsQuery = useQuery(applicationStatsQueryOptions)

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-heading font-medium">Dashboard</h1>

      {statsQuery.isError && (
        <p className="text-sm text-destructive">
          Couldn't load your stats. Try refreshing the page.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statsQuery.isPending
          ? SUMMARY_CARDS.map(({ key }) => (
              <Card key={key}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))
          : statsQuery.isSuccess &&
            SUMMARY_CARDS.map(({ key, label }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-heading font-medium">
                    {statsQuery.data[key]}
                  </span>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}
