import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'

interface CreateApplicationInput {
  title: string
  companyName: string
  description?: string
  externalUrl?: string
  salary?: number
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
