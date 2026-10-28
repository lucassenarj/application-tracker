import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { UpcomingInterview } from './upcoming-interviews'

export function interviewsByMonthQueryOptions(year: number, month: number) {
  return queryOptions({
    queryKey: ['applications', 'interviews', year, month],
    queryFn: () =>
      apiFetch<UpcomingInterview[]>(
        `/applications/interviews?year=${year}&month=${month}`,
      ),
  })
}
