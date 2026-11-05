import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface ResetPasswordInput {
  token: string
  newPassword: string
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      apiFetch<void>('/auth/reset-password', { method: 'POST', body: input }),
  })
}
