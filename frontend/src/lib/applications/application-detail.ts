import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from '../api-client'
import type { ApplicationStatus } from './applications-list'

export type InterviewCategory = 'TECHNICAL' | 'NON_TECHNICAL'

export interface Contact {
  name: string
  email: string
}

export interface StatusChange {
  id: string
  status: ApplicationStatus
  eventDate: string
  notes?: string
  contact?: Contact
  interviewCategory?: InterviewCategory
  createdAt: string
}

export interface ApplicationDetail {
  id: string
  title: string
  description?: string
  externalUrl?: string
  salary?: number
  currency?: string
  companyName: string
  currentStatus: ApplicationStatus
  availableTransitions: ApplicationStatus[]
  statusHistory: StatusChange[]
  createdAt: string
}

export function applicationDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['applications', 'detail', id],
    queryFn: () => apiFetch<ApplicationDetail>(`/applications/${id}`),
  })
}
