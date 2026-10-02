import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { APPLICATION_STATUS_CATEGORIES } from '@/lib/applications/applications-list'
import { ApplicationsPage } from '@/pages/applications-page'

export const applicationsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  category: z.enum(APPLICATION_STATUS_CATEGORIES).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/applications')({
  head: () => ({
    meta: [{ title: 'Applications - Application Tracker' }],
  }),
  validateSearch: zodValidator(applicationsSearchSchema),
  component: ApplicationsPage,
})
