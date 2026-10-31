import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface Tag {
  id: string
  name: string
}

export function tagSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ['tags', 'search', query],
    queryFn: () =>
      apiFetch<Tag[]>(`/tags/search?q=${encodeURIComponent(query)}`),
  })
}
