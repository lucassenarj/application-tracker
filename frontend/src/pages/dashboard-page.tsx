import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatStatus,
  latestApplicationsQueryOptions,
  type ApplicationStatus,
} from '@/lib/dashboard/applications-list'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'

const SUMMARY_CARDS = [
  { key: 'total', label: 'Total' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'offers', label: 'Offers' },
  { key: 'rejections', label: 'Rejections' },
] as const

interface ChangeStatusTarget {
  applicationId: string
  availableTransitions: ApplicationStatus[]
}

export function DashboardPage() {
  const navigate = useNavigate()
  const statsQuery = useQuery(applicationStatsQueryOptions)
  const applicationsQuery = useQuery(latestApplicationsQueryOptions)
  const [changeStatusTarget, setChangeStatusTarget] =
    useState<ChangeStatusTarget | null>(null)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-medium">Dashboard</h1>
        <NewApplicationDialog />
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Latest Applications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {applicationsQuery.isPending &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}

          {applicationsQuery.isError && (
            <p className="text-sm text-destructive">
              Couldn't load your applications. Try refreshing the page.
            </p>
          )}

          {applicationsQuery.isSuccess &&
            (applicationsQuery.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              applicationsQuery.data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2 cursor-pointer last:border-b-0 last:pb-0"
                  onClick={() =>
                    navigate({
                      to: '/applications/$id',
                      params: { id: item.id },
                    })
                  }
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.companyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.availableTransitions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Change status for ${item.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setChangeStatusTarget({
                            applicationId: item.id,
                            availableTransitions: item.availableTransitions,
                          })
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-sm">
                        {formatStatus(item.currentStatus)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ))}
        </CardContent>
      </Card>

      <Link
        to="/applications"
        search={{ page: 1 }}
        className="self-center text-sm underline underline-offset-4"
      >
        See more
      </Link>

      {changeStatusTarget && (
        <ChangeStatusDialog
          applicationId={changeStatusTarget.applicationId}
          availableTransitions={changeStatusTarget.availableTransitions}
          open={changeStatusTarget !== null}
          onOpenChange={(open) => {
            if (!open) setChangeStatusTarget(null)
          }}
          onSuccess={() => {
            navigate({
              to: '/applications/$id',
              params: { id: changeStatusTarget.applicationId },
            })
          }}
        />
      )}
    </div>
  )
}
