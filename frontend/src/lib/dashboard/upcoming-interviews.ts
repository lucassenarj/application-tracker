import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { InterviewCategory } from '@/lib/applications/application-detail'

export interface UpcomingInterview {
  statusChangeId: string
  applicationId: string
  applicationTitle: string
  companyName: string
  eventDate: string
  interviewCategory?: InterviewCategory
}

export const upcomingInterviewsQueryOptions = queryOptions({
  queryKey: ['applications', 'interviews', 'upcoming'],
  queryFn: () =>
    apiFetch<UpcomingInterview[]>('/applications/interviews/upcoming'),
})
