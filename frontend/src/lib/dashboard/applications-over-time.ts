import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface ApplicationsOverTimeBucket {
  weekStart: string
  count: number
}

export const applicationsOverTimeQueryOptions = queryOptions({
  queryKey: ['applications', 'over-time'],
  queryFn: () =>
    apiFetch<ApplicationsOverTimeBucket[]>('/applications/over-time'),
})
