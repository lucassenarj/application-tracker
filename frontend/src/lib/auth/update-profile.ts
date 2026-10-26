import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import { userQueryOptions, type User } from './user-query'

interface UpdateProfileInput {
  name?: string
  avatar?: string
  phone?: string
  bio?: string
  language?: string
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiFetch<User>('/auth/me', { method: 'PATCH', body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(userQueryOptions.queryKey, data)
    },
  })
}
