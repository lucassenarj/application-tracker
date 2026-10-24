import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Briefcase,
  Clock,
  Pencil,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { CategoryProgressBars } from '@/components/category-progress-bars'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { StatusDonutChart } from '@/components/status-donut-chart'
import { TiltCard } from '@/components/tilt-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApplicationStatusCategory } from '@/lib/applications/applications-list'
import {
  formatStatus,
  latestApplicationsQueryOptions,
  type ApplicationStatus,
} from '@/lib/dashboard/applications-list'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'

const SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total',
    category: undefined,
    icon: Briefcase,
    tileClassName: 'bg-linear-to-br from-primary/20 to-primary/5 shadow-primary/20',
    iconClassName: 'text-primary',
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    category: 'IN_PROGRESS',
    icon: Clock,
    tileClassName:
      'bg-linear-to-br from-emerald-light/20 to-emerald-light/5 shadow-emerald-light/20',
    iconClassName: 'text-emerald-light',
  },
  {
    key: 'offers',
    label: 'Offers',
    category: 'OFFERS',
    icon: Trophy,
    tileClassName: 'bg-linear-to-br from-chart-3/20 to-chart-3/5 shadow-chart-3/20',
    iconClassName: 'text-chart-3',
  },
  {
    key: 'rejections',
    label: 'Rejections',
    category: 'REJECTIONS',
    icon: XCircle,
    tileClassName: 'bg-linear-to-br from-chart-4/20 to-chart-4/5 shadow-chart-4/20',
    iconClassName: 'text-chart-4',
  },
] as const satisfies ReadonlyArray<{
  key: 'total' | 'inProgress' | 'offers' | 'rejections'
  label: string
  category?: ApplicationStatusCategory
  icon: LucideIcon
  tileClassName: string
  iconClassName: string
}>

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
    <div className="flex flex-col gap-[30px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-heading font-semibold">Dashboard</h1>
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
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="size-14 shrink-0 rounded-[16px]" />
                </CardContent>
              </Card>
            ))
          : statsQuery.isSuccess &&
            SUMMARY_CARDS.map(
              ({ key, label, category, icon: Icon, tileClassName, iconClassName }) => (
                <TiltCard key={key}>
                  <Card
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/applications',
                        search: { page: 1, category },
                      })
                    }
                  >
                    <CardContent className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
                          {label}
                        </CardTitle>
                        <span
                          data-testid={`stat-value-${key}`}
                          className="text-3xl font-mono font-medium"
                        >
                          {statsQuery.data[key]}
                        </span>
                      </div>
                      <div
                        className={`flex size-14 shrink-0 items-center justify-center rounded-[16px] shadow-lg ${tileClassName}`}
                      >
                        <Icon className={`size-6 ${iconClassName}`} />
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              ),
            )}
      </div>

      <h2 className="text-xl font-heading font-medium">Latest Applications</h2>

      <Card>
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

      {statsQuery.isSuccess && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StatusDonutChart stats={statsQuery.data} />
          <CategoryProgressBars stats={statsQuery.data} />
        </div>
      )}

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
