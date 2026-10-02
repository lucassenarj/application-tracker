import { useQuery } from '@tanstack/react-query'
import { useCanGoBack, useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { applicationDetailQueryOptions } from '@/lib/applications/application-detail'
import { formatStatus } from '@/lib/dashboard/applications-list'

export function ApplicationDetailPage() {
  const { id } = useParams({ from: '/_authenticated/applications_/$id' })
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const query = useQuery(applicationDetailQueryOptions(id))

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
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-heading font-medium">
            {query.data.title}
          </h1>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <span>{query.data.companyName}</span>
            <span>·</span>
            <span>{formatStatus(query.data.currentStatus)}</span>
          </p>

          <ul
            data-testid="status-timeline"
            className="flex w-full flex-col gap-2"
          >
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
