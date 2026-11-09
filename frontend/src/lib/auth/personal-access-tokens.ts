import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface PersonalAccessToken {
  id: string
  label: string
  createdAt: string
  expiresAt?: string
  lastUsedAt?: string
  revokedAt?: string
}

export function personalAccessTokensQueryOptions() {
  return queryOptions({
    queryKey: ['personal-access-tokens'],
    queryFn: () => apiFetch<PersonalAccessToken[]>('/auth/personal-access-tokens'),
  })
}
