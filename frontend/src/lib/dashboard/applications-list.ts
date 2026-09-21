import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export type ApplicationStatus =
  | 'APPLIED'
  | 'WAITING_FEEDBACK'
  | 'ASSIGNMENT'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'REJECTED'

export interface ApplicationListItem {
  id: string
  title: string
  companyName: string
  currentStatus: ApplicationStatus
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
}

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
