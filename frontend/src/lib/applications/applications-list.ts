import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export const APPLICATION_STATUSES = [
  'APPLIED',
  'WAITING_FEEDBACK',
  'ASSIGNMENT',
  'INTERVIEW_SCHEDULED',
  'OFFER',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'REJECTED',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATIONS_PAGE_SIZE = 10

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

export function applicationsListQueryOptions(
  page: number,
  status?: ApplicationStatus,
  search?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(APPLICATIONS_PAGE_SIZE),
  })
  if (status) {
    params.set('status', status)
  }
  if (search) {
    params.set('search', search)
  }

  return queryOptions({
    queryKey: ['applications', 'list', { page, status, search }],
    queryFn: () =>
      apiFetch<PaginatedResult<ApplicationListItem>>(
        `/applications?${params.toString()}`,
      ),
  })
}
