import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import { personalAccessTokensQueryOptions } from './personal-access-tokens'

export function useRevokePersonalAccessTokenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/auth/personal-access-tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: personalAccessTokensQueryOptions().queryKey,
      })
    },
  })
}
