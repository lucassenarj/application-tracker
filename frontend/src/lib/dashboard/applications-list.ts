import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type {
  ApplicationListItem,
  ApplicationStatus,
  PaginatedResult,
} from '../applications/applications-list'

export type {
  ApplicationListItem,
  ApplicationStatus,
  PaginatedResult,
} from '../applications/applications-list'

export const latestApplicationsQueryOptions = queryOptions({
  queryKey: ['applications', 'list', { page: 1, pageSize: 10 }],
  queryFn: () =>
    apiFetch<PaginatedResult<ApplicationListItem>>(
      '/applications?page=1&pageSize=10',
    ),
})

export function formatStatus(status: ApplicationStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
