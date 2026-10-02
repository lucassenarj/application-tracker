import { useQuery } from '@tanstack/react-query'
import { useCanGoBack, useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationDetailQueryOptions } from '@/lib/applications/application-detail'
import {
  formatStatus,
  type ApplicationStatus,
} from '@/lib/dashboard/applications-list'

function getStatusBadgeStyle(
  status: ApplicationStatus,
): { variant: 'secondary' | 'destructive'; className?: string } {
  switch (status) {
    case 'INTERVIEW_SCHEDULED':
    case 'OFFER':
    case 'OFFER_ACCEPTED':
      return {
        variant: 'secondary',
        className:
          'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
      }
    case 'WAITING_FEEDBACK':
      return {
        variant: 'secondary',
        className:
          'bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
      }
    case 'REJECTED':
      return { variant: 'destructive' }
    case 'OFFER_DECLINED':
      return {
        variant: 'secondary',
        className:
          'bg-red-500/10 text-red-500/80 dark:bg-red-500/10 dark:text-red-400/80',
      }
    default:
      return { variant: 'secondary' }
  }
}

export function ApplicationDetailPage() {
  const { id } = useParams({ from: '/_authenticated/applications_/$id' })
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const query = useQuery(applicationDetailQueryOptions(id))
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const goBack = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      router.navigate({ to: '/applications', search: { page: 1 } })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Button variant="ghost" className="w-fit" onClick={goBack}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {query.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {query.isSuccess && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <title>{`${query.data.title} - ${query.data.companyName} - Application Tracker`}</title>
          <div className="flex flex-col items-start gap-4 lg:col-span-2">
            <h1 className="text-2xl font-heading font-medium">
              {query.data.title}
            </h1>
            <p className="flex gap-2 text-sm text-muted-foreground">
              <span>{query.data.companyName}</span>
              <span>·</span>
              <span>{formatStatus(query.data.currentStatus)}</span>
            </p>

            {(query.data.salary !== undefined || query.data.externalUrl) && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {query.data.salary !== undefined && (
                  <span className="text-muted-foreground">
                    Salary: €{query.data.salary.toLocaleString()}
                  </span>
                )}
                {query.data.externalUrl && (
                  <a
                    href={query.data.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    View job posting
                  </a>
                )}
              </div>
            )}

            {query.data.description && (
              <div className="flex w-full flex-col gap-1">
                <p
                  className={`text-sm whitespace-pre-wrap break-words text-muted-foreground lg:line-clamp-none ${
                    descriptionExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {query.data.description}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto self-start p-0 text-sm lg:hidden"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                >
                  {descriptionExpanded ? 'Show less' : 'Show more'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:col-span-1">
            <h2 className="text-sm font-medium text-muted-foreground">
              Status History
            </h2>

            <ul
              data-testid="status-timeline"
              className="flex w-full flex-col"
            >
              {query.data.statusHistory.map((change, index) => {
                const badgeStyle = getStatusBadgeStyle(change.status)
                return (
                  <li key={change.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                      {index < query.data.statusHistory.length - 1 && (
                        <span className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 pb-4">
                      <Badge
                        variant={badgeStyle.variant}
                        className={badgeStyle.className}
                      >
                        {formatStatus(change.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(change.eventDate).toLocaleDateString()}
                        {change.interviewCategory &&
                          ` · ${change.interviewCategory === 'TECHNICAL' ? 'Technical' : 'Non-technical'}`}
                      </span>
                      {change.contact && (
                        <span className="text-sm text-muted-foreground">
                          {[change.contact.name, change.contact.email]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                      {change.notes && (
                        <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
                          {change.notes}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <ChangeStatusDialog
              applicationId={id}
              availableTransitions={query.data.availableTransitions}
            />
          </div>
        </div>
      )}

      {query.isError && (
        <p className="text-sm text-destructive">
          Couldn't load this application. Try refreshing the page.
        </p>
      )}
    </div>
  )
}
