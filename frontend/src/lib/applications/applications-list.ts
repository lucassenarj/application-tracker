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

export const APPLICATION_STATUS_CATEGORIES = [
  'IN_PROGRESS',
  'OFFERS',
  'REJECTIONS',
] as const

export type ApplicationStatusCategory =
  (typeof APPLICATION_STATUS_CATEGORIES)[number]

export const APPLICATIONS_PAGE_SIZE = 10

export interface ApplicationListItem {
  id: string
  title: string
  companyName: string
  currentStatus: ApplicationStatus
  availableTransitions: ApplicationStatus[]
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
}

export function applicationsListQueryOptions(
  page: number,
  category?: ApplicationStatusCategory,
  search?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(APPLICATIONS_PAGE_SIZE),
  })
  if (category) {
    params.set('category', category)
  }
  if (search) {
    params.set('search', search)
  }

  return queryOptions({
    queryKey: ['applications', 'list', { page, category, search }],
    queryFn: () =>
      apiFetch<PaginatedResult<ApplicationListItem>>(
        `/applications?${params.toString()}`,
      ),
  })
}
