import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApplicationStatus } from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'
import { getCompanyInitials } from '@/lib/dashboard/company-initials'
import { recentActivityQueryOptions } from '@/lib/dashboard/recent-activity'
import { formatRelativeTime } from '@/lib/relative-time'

type StatusColorFamily = 'green' | 'orange' | 'red' | 'neutral'

function getStatusColorFamily(status: ApplicationStatus): StatusColorFamily {
  switch (status) {
    case 'INTERVIEW_SCHEDULED':
    case 'OFFER':
    case 'OFFER_ACCEPTED':
      return 'green'
    case 'WAITING_FEEDBACK':
      return 'orange'
    case 'REJECTED':
    case 'OFFER_DECLINED':
      return 'red'
    default:
      return 'neutral'
  }
}

const AVATAR_GRADIENT_BY_FAMILY: Record<StatusColorFamily, string> = {
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
  red: 'bg-gradient-to-br from-red-400 to-red-600',
  neutral: 'bg-gradient-to-br from-slate-400 to-slate-600',
}

const STATUS_TEXT_COLOR_BY_FAMILY: Record<StatusColorFamily, string> = {
  green: 'text-green-700 dark:text-green-400',
  orange: 'text-orange-700 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  neutral: 'text-foreground',
}

function getAvatarGradient(status: ApplicationStatus): string {
  return AVATAR_GRADIENT_BY_FAMILY[getStatusColorFamily(status)]
}

function getStatusTextColor(status: ApplicationStatus): string {
  return STATUS_TEXT_COLOR_BY_FAMILY[getStatusColorFamily(status)]
}

export function RecentActivityFeed() {
  const navigate = useNavigate()
  const activityQuery = useQuery(recentActivityQueryOptions)

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {activityQuery.isPending && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {activityQuery.isError && (
          <p className="text-sm text-destructive">
            Couldn't load your recent activity. Try refreshing the page.
          </p>
        )}

        {activityQuery.isSuccess &&
          (activityQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div>
              {activityQuery.data.map((item) => (
                <div
                  key={item.statusChangeId}
                  className="flex cursor-pointer items-start gap-3.5 border-b border-border py-3.5 last:border-b-0"
                  onClick={() => goToDetail(item.applicationId)}
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold text-white ${getAvatarGradient(item.status)}`}
                  >
                    {getCompanyInitials(item.companyName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">
                      <strong className="font-medium text-foreground">
                        {item.applicationTitle}
                      </strong>
                      {` at ${item.companyName} moved to `}
                      <span className={getStatusTextColor(item.status)}>
                        {formatStatus(item.status)}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground/70">
                      {formatRelativeTime(new Date(item.eventDate))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
