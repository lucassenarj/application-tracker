import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface Company {
  id: string
  name: string
  website?: string
}

export function companySearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ['companies', 'search', query],
    queryFn: () =>
      apiFetch<Company[]>(`/companies/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  })
}
