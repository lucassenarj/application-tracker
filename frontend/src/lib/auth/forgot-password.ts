import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface ForgotPasswordInput {
  email: string
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      apiFetch<void>('/auth/forgot-password', { method: 'POST', body: input }),
  })
}
