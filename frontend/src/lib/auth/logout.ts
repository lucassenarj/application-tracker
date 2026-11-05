import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiFetch, invalidateCsrfToken } from '../api-client'
import { userQueryOptions } from './user-query'

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      invalidateCsrfToken()
      queryClient.removeQueries({ queryKey: userQueryOptions.queryKey })
      navigate({ to: '/login' })
    },
  })
}
