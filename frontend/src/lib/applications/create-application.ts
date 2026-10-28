import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface CreateApplicationInput {
  title: string
  companyName: string
  companyId?: string
  description?: string
  externalUrl?: string
  salary?: number
  currency?: string
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      apiFetch('/applications', { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'list'] })
    },
  })
}
