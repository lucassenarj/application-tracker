import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
}

export const userQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => apiFetch<User>('/auth/me'),
  retry: false,
})
