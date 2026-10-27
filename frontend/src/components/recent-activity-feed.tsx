import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApplicationStatus } from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'
import { recentActivityQueryOptions } from '@/lib/dashboard/recent-activity'
import { formatRelativeTime } from '@/lib/relative-time'

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarGradient(status: ApplicationStatus): string {
  switch (status) {
    case 'INTERVIEW_SCHEDULED':
    case 'OFFER':
    case 'OFFER_ACCEPTED':
      return 'bg-gradient-to-br from-green-400 to-green-600'
    case 'WAITING_FEEDBACK':
      return 'bg-gradient-to-br from-orange-400 to-orange-600'
    case 'REJECTED':
    case 'OFFER_DECLINED':
      return 'bg-gradient-to-br from-red-400 to-red-600'
    default:
      return 'bg-gradient-to-br from-slate-400 to-slate-600'
  }
}

export function RecentActivityFeed() {
  const navigate = useNavigate()
  const activityQuery = useQuery(recentActivityQueryOptions)

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Status changes across all your applications
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
                      {` at ${item.companyName} moved to ${formatStatus(item.status)}`}
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
