import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import { personalAccessTokensQueryOptions } from './personal-access-tokens'

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000
const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000

export interface CreatePersonalAccessTokenInput {
  label: string
  expirationOption: '1-week' | '1-month' | 'custom' | 'never'
  customExpiresAt?: string
}

export interface CreatePersonalAccessTokenResult {
  id: string
  label: string
  token: string
  expiresAt?: string
  createdAt: string
}

export function computeExpiresAt(
  input: CreatePersonalAccessTokenInput,
): string | undefined {
  switch (input.expirationOption) {
    case '1-week':
      return new Date(Date.now() + ONE_WEEK_IN_MS).toISOString()
    case '1-month':
      return new Date(Date.now() + ONE_MONTH_IN_MS).toISOString()
    case 'custom':
      return input.customExpiresAt
    case 'never':
      return undefined
  }
}

export function useCreatePersonalAccessTokenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePersonalAccessTokenInput) =>
      apiFetch<CreatePersonalAccessTokenResult>('/auth/personal-access-tokens', {
        method: 'POST',
        body: { label: input.label, expiresAt: computeExpiresAt(input) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: personalAccessTokensQueryOptions().queryKey,
      })
    },
  })
}
