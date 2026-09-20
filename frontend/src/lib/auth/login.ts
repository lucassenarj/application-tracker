import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiFetch } from '../api-client'
import { userQueryOptions, type User } from './user-query'

interface LoginInput {
  email: string
  password: string
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<User>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (user) => {
      queryClient.setQueryData(userQueryOptions.queryKey, user)
      navigate({ to: '/dashboard' })
    },
  })
}
