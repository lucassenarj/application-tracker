import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { InterviewCategory } from './application-detail'

interface ChangeStatusInput {
  status: string
  eventDate: string
  interviewCategory?: InterviewCategory
  contactName?: string
  contactEmail?: string
  notes?: string
}

export function useChangeStatusMutation(applicationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ChangeStatusInput) =>
      apiFetch(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['applications', 'detail', applicationId],
      })
    },
  })
}
