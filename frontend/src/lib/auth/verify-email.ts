import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface VerifyEmailInput {
  token: string
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (input: VerifyEmailInput) =>
      apiFetch<void>('/auth/verify-email', { method: 'POST', body: input }),
  })
}
