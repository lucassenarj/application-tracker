import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { APPLICATION_STATUSES } from '@/lib/applications/applications-list'
import { ApplicationsPage } from '@/pages/applications-page'

export const applicationsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  status: z.enum(APPLICATION_STATUSES).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: zodValidator(applicationsSearchSchema),
  component: ApplicationsPage,
})
