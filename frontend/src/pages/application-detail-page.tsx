import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationDetailQueryOptions } from '@/lib/applications/application-detail'
import { formatStatus } from '@/lib/dashboard/applications-list'

export function ApplicationDetailPage() {
  const { id } = useParams({ from: '/_authenticated/applications_/$id' })
  const query = useQuery(applicationDetailQueryOptions(id))

  return (
    <div className="flex flex-col gap-6 p-6">
      {query.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {query.isSuccess && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-heading font-medium">
            {query.data.title}
          </h1>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <span>{query.data.companyName}</span>
            <span>·</span>
            <span>{formatStatus(query.data.currentStatus)}</span>
          </p>

          <ul data-testid="status-timeline" className="flex flex-col gap-2">
            {query.data.statusHistory.map((change) => (
              <li key={change.id} className="flex gap-2 text-sm">
                <span>{formatStatus(change.status)}</span>
                <span>{new Date(change.eventDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>

          <ChangeStatusDialog
            applicationId={id}
            availableTransitions={query.data.availableTransitions}
          />
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
