import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  APPLICATIONS_PAGE_SIZE,
  applicationsListQueryOptions,
  type ApplicationStatus,
  type ApplicationStatusCategory,
} from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'

interface ChangeStatusTarget {
  applicationId: string
  availableTransitions: ApplicationStatus[]
  initialStatus: ApplicationStatus
}

export function ApplicationsPage() {
  const { page, category, search } = useSearch({
    from: '/_authenticated/applications',
  })
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search ?? '')
  const debouncedSearchInput = useDebouncedValue(searchInput, 400)
  const [changeStatusTarget, setChangeStatusTarget] =
    useState<ChangeStatusTarget | null>(null)
  const query = useQuery(applicationsListQueryOptions(page, category, search))

  useEffect(() => {
    const nextSearch = debouncedSearchInput || undefined
    if (nextSearch === search) return

    navigate({
      to: '/applications',
      search: { page: 1, category, search: nextSearch },
      replace: true,
    })
  }, [debouncedSearchInput, category, search, navigate])

  const setCategory = (value: string) => {
    navigate({
      to: '/applications',
      search: {
        page: 1,
        category:
          value === 'ALL' ? undefined : (value as ApplicationStatusCategory),
        search,
      },
      replace: true,
    })
  }

  const goToPage = (nextPage: number) => {
    navigate({
      to: '/applications',
      search: { page: nextPage, category, search },
      replace: true,
    })
  }

  const totalPages = query.data
    ? Math.ceil(query.data.total / APPLICATIONS_PAGE_SIZE)
    : 0

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-heading font-semibold">Applications</h1>
        <NewApplicationDialog />
      </div>

      <Tabs value={category ?? 'ALL'} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="OFFERS">Offers</TabsTrigger>
          <TabsTrigger value="REJECTIONS">Rejections</TabsTrigger>
        </TabsList>
      </Tabs>

      <Input
        aria-label="Search by title or company"
        placeholder="Search by title or company"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {query.isFetching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {query.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <p className="text-sm text-destructive">
          Couldn't load your applications. Try refreshing the page.
        </p>
      )}

      {query.isSuccess && query.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      )}

      {query.isSuccess && query.data.items.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/applications/$id',
                      params: { id: item.id },
                    })
                  }
                >
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {item.availableTransitions.length > 0 ? (
                      <Select
                        value={item.currentStatus}
                        onValueChange={(value) => {
                          if (!value || value === item.currentStatus) return
                          setChangeStatusTarget({
                            applicationId: item.id,
                            availableTransitions: item.availableTransitions,
                            initialStatus: value as ApplicationStatus,
                          })
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Change status for ${item.title}`}
                        >
                          <SelectValue>
                            {() => formatStatus(item.currentStatus)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {item.availableTransitions.map((s) => (
                            <SelectItem key={s} value={s}>
                              {formatStatus(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      formatStatus(item.currentStatus)
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {changeStatusTarget && (
        <ChangeStatusDialog
          applicationId={changeStatusTarget.applicationId}
          availableTransitions={changeStatusTarget.availableTransitions}
          initialStatus={changeStatusTarget.initialStatus}
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
