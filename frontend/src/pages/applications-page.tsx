import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
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
import { NewApplicationDialog } from '@/components/new-application-dialog'
import {
  APPLICATION_STATUSES,
  APPLICATIONS_PAGE_SIZE,
  applicationsListQueryOptions,
  type ApplicationStatus,
} from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'

export function ApplicationsPage() {
  const { page, status, search } = useSearch({
    from: '/_authenticated/applications',
  })
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search ?? '')
  const debouncedSearchInput = useDebouncedValue(searchInput, 400)
  const query = useQuery(applicationsListQueryOptions(page, status, search))

  useEffect(() => {
    const nextSearch = debouncedSearchInput || undefined
    if (nextSearch === search) return

    navigate({
      to: '/applications',
      search: { page: 1, status, search: nextSearch },
      replace: true,
    })
  }, [debouncedSearchInput, status, search, navigate])

  const setStatus = (value: string | null) => {
    if (value === null) return

    navigate({
      to: '/applications',
      search: {
        page: 1,
        status: value === 'ALL' ? undefined : (value as ApplicationStatus),
        search,
      },
      replace: true,
    })
  }

  const goToPage = (nextPage: number) => {
    navigate({
      to: '/applications',
      search: { page: nextPage, status, search },
      replace: true,
    })
  }

  const totalPages = query.data
    ? Math.ceil(query.data.total / APPLICATIONS_PAGE_SIZE)
    : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-medium">Applications</h1>
        <NewApplicationDialog />
      </div>

      <Select value={status ?? 'ALL'} onValueChange={setStatus}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {formatStatus(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
                  <TableCell>{formatStatus(item.currentStatus)}</TableCell>
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
    </div>
  )
}
