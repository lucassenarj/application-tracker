import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCompanyInitials } from '@/lib/dashboard/company-initials'
import { upcomingInterviewsQueryOptions } from '@/lib/dashboard/upcoming-interviews'

function formatInterviewDateTime(eventDate: string): string {
  return new Date(eventDate).toLocaleString(navigator.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function UpcomingInterviewsList() {
  const navigate = useNavigate()
  const query = useQuery(upcomingInterviewsQueryOptions)

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Interview Schedule</CardTitle>
      </CardHeader>
      <CardContent className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {query.isPending && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="text-sm text-destructive">
            Couldn't load your upcoming interviews. Try refreshing the page.
          </p>
        )}

        {query.isSuccess &&
          (query.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming interviews scheduled.
            </p>
          ) : (
            <div>
              {query.data.map((interview) => (
                <div
                  key={interview.statusChangeId}
                  className="flex cursor-pointer items-start gap-3.5 border-b border-border py-3.5 last:border-b-0"
                  onClick={() => goToDetail(interview.applicationId)}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary/70 to-primary text-sm font-semibold text-white">
                    {getCompanyInitials(interview.companyName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {interview.applicationTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {interview.companyName}
                    </p>
                    <span className="text-xs text-muted-foreground/70">
                      {formatInterviewDateTime(interview.eventDate)}
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
