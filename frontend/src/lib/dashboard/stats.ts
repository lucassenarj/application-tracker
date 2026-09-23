import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface ApplicationStats {
  total: number
  inProgress: number
  offers: number
  rejections: number
}

export const applicationStatsQueryOptions = queryOptions({
  queryKey: ['applications', 'stats'],
  queryFn: () => apiFetch<ApplicationStats>('/applications/stats'),
})
