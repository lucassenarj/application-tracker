import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Briefcase,
  Clock,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { ApplicationsOverTimeChart } from '@/components/applications-over-time-chart'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { RecentActivityFeed } from '@/components/recent-activity-feed'
import { ThemeToggle } from '@/components/theme-toggle'
import { TiltCard } from '@/components/tilt-card'
import { UpcomingInterviewsCalendar } from '@/components/upcoming-interviews-calendar'
import { UpcomingInterviewsList } from '@/components/upcoming-interviews-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ApplicationStatusCategory } from '@/lib/applications/applications-list'
import {
  formatStatus,
  latestApplicationsQueryOptions,
} from '@/lib/dashboard/applications-list'
import { getStatusBadgeStyle } from '@/lib/dashboard/status-badge'
import { applicationStatsQueryOptions } from '@/lib/dashboard/stats'
import { formatRelativeTime } from '@/lib/relative-time'

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

export function DashboardPage() {
  const navigate = useNavigate()
  const statsQuery = useQuery(applicationStatsQueryOptions)
  const applicationsQuery = useQuery(latestApplicationsQueryOptions)

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-heading font-semibold">Dashboard</h1>
        <div className="flex items-center gap-[15px]">
          <ThemeToggle />
          <NewApplicationDialog />
        </div>
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
                        <p className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
                          {label}
                        </p>
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

      <div className="grid grid-cols-1 gap-6 lg:h-[460px] lg:grid-cols-3">
        <UpcomingInterviewsCalendar />
        <UpcomingInterviewsList />
        <RecentActivityFeed />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Latest Applications</CardTitle>
            <CardDescription>Your most recently updated applications</CardDescription>
          </div>
          <Link
            to="/applications"
            search={{ page: 1 }}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            See more
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {applicationsQuery.isPending && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {applicationsQuery.isError && (
            <p className="text-sm text-destructive">
              Couldn't load your applications. Try refreshing the page.
            </p>
          )}

          {applicationsQuery.isSuccess &&
            (applicationsQuery.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationsQuery.data.items.map((item) => {
                    const badgeStyle = getStatusBadgeStyle(item.currentStatus)
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => goToDetail(item.id)}
                      >
                        <TableCell className="font-medium text-foreground">
                          {item.title}
                        </TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell>
                          {formatRelativeTime(new Date(item.updatedAt))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={badgeStyle.variant}
                            className={badgeStyle.className}
                          >
                            {formatStatus(item.currentStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ))}
        </CardContent>
      </Card>

      <ApplicationsOverTimeChart />
    </div>
  )
}
