import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  revokeOtherSessions: boolean
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiFetch<void>('/auth/password', { method: 'PATCH', body: input }),
  })
}
