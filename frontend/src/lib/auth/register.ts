import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { User } from './user-query'

interface RegisterInput {
  name: string
  email: string
  password: string
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<User>('/auth/register', { method: 'POST', body: input }),
  })
}
