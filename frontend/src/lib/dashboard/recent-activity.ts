import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { ApplicationStatus } from '@/lib/applications/applications-list'

export interface RecentActivityItem {
  statusChangeId: string
  applicationId: string
  applicationTitle: string
  companyName: string
  status: ApplicationStatus
  eventDate: string
}

export const recentActivityQueryOptions = queryOptions({
  queryKey: ['applications', 'recent-activity'],
  queryFn: () =>
    apiFetch<RecentActivityItem[]>('/applications/recent-activity'),
})
