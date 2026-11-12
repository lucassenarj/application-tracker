import { useQuery } from '@tanstack/react-query'
import { Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { PageHeader } from '@/components/page-header'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  type ApplicationStatusCategory,
} from '@/lib/applications/applications-list'
import { formatStatus } from '@/lib/dashboard/applications-list'
import { getStatusBadgeStyle } from '@/lib/dashboard/status-badge'
import { formatRelativeTime } from '@/lib/relative-time'
import { cn } from 'cn'

export function ApplicationsPage() {
  const { page, category, search, tags } = useSearch({
    from: '/_authenticated/applications',
  })
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search ?? '')
  const debouncedSearchInput = useDebouncedValue(searchInput, 400)
  const query = useQuery(
    applicationsListQueryOptions(page, category, search, tags),
  )

  useEffect(() => {
    const nextSearch = debouncedSearchInput || undefined
    if (nextSearch === search) return

    navigate({
      to: '/applications',
      search: { page: 1, category, search: nextSearch, tags },
      replace: true,
    })
  }, [debouncedSearchInput, category, search, tags, navigate])

  const setCategory = (value: string) => {
    navigate({
      to: '/applications',
      search: {
        page: 1,
        category:
          value === 'ALL' ? undefined : (value as ApplicationStatusCategory),
        search,
        tags,
      },
      replace: true,
    })
  }

  const setTags = (nextTags: string[]) => {
    navigate({
      to: '/applications',
      search: {
        page: 1,
        category,
        search,
        tags: nextTags.length > 0 ? nextTags : undefined,
      },
      replace: true,
    })
  }

  const toggleTagFilter = (tag: string) => {
    const current = tags ?? []
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    setTags(next)
  }

  const renderTagButton = (tag: string) => (
    <button
      key={tag}
      type="button"
      className={cn(
        badgeVariants({ variant: 'outline' }),
        'h-auto cursor-pointer p-2 hover:bg-emerald-light/20',
        tags?.includes(tag) && 'bg-accent',
      )}
      onClick={() => toggleTagFilter(tag)}
    >
      {tag}
    </button>
  )

  const goToPage = (nextPage: number) => {
    navigate({
      to: '/applications',
      search: { page: nextPage, category, search, tags },
      replace: true,
    })
  }

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  const totalPages = query.data
    ? Math.ceil(query.data.total / APPLICATIONS_PAGE_SIZE)
    : 0

  return (
    <div className="flex flex-col gap-[30px]">
      <PageHeader title="Applications" />

      <Tabs value={category ?? 'ALL'} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="OFFERS">Offers</TabsTrigger>
          <TabsTrigger value="REJECTIONS">Rejections</TabsTrigger>
        </TabsList>
      </Tabs>

      {tags && tags.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtering by tags: {tags.join(', ')}</span>
          <Button variant="ghost" size="sm" onClick={() => setTags([])}>
            Clear tags
          </Button>
        </div>
      )}

      {query.isFetching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>Manage your job applications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                aria-label="Search by title or company"
                placeholder="Search by title or company"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64 pr-9"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:cursor-pointer hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <NewApplicationDialog />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.items.map((item) => {
                    const badgeStyle = getStatusBadgeStyle(item.currentStatus)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground">
                          {item.title}
                        </TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map(renderTagButton)}
                            {item.tags.length > 3 && (
                              <Popover>
                                <PopoverTrigger
                                  render={
                                    <button
                                      type="button"
                                      className={cn(
                                        badgeVariants({ variant: 'outline' }),
                                        'h-auto cursor-pointer p-2 hover:bg-emerald-light/20',
                                      )}
                                    >
                                      +{item.tags.length - 3} more
                                    </button>
                                  }
                                />
                                <PopoverContent>
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(3).map(renderTagButton)}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={badgeStyle.variant}
                            className={badgeStyle.className}
                          >
                            {formatStatus(item.currentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {formatRelativeTime(new Date(item.updatedAt))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="View"
                            onClick={() => goToDetail(item.id)}
                          >
                            <Eye />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
        </CardContent>
      </Card>
    </div>
  )
}
