import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { ApplicationStatusCategory } from '@/lib/applications/applications-list'

export interface ApplicationStats {
  total: number
  inProgress: number
  offers: number
  rejections: number
}

export interface CategoryBreakdownItem {
  category: ApplicationStatusCategory
  count: number
  percentage: number
}

export const applicationStatsQueryOptions = queryOptions({
  queryKey: ['applications', 'stats'],
  queryFn: () => apiFetch<ApplicationStats>('/applications/stats'),
})

export function categoryBreakdown(
  stats: ApplicationStats,
): CategoryBreakdownItem[] {
  const categories: Array<{
    category: ApplicationStatusCategory
    count: number
  }> = [
    { category: 'IN_PROGRESS', count: stats.inProgress },
    { category: 'OFFERS', count: stats.offers },
    { category: 'REJECTIONS', count: stats.rejections },
  ]

  if (stats.total === 0) {
    return categories.map((item) => ({ ...item, percentage: 0 }))
  }

  const exact = categories.map((item) => (item.count / stats.total) * 100)
  const floored = exact.map(Math.floor)
  const remainder = 100 - floored.reduce((sum, value) => sum + value, 0)

  const byLargestFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  const percentages = [...floored]
  for (let i = 0; i < remainder && i < byLargestFraction.length; i++) {
    percentages[byLargestFraction[i].index] += 1
  }

  return categories.map((item, index) => ({
    ...item,
    percentage: percentages[index],
  }))
}
