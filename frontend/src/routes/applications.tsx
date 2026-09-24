import { createFileRoute, redirect } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { APPLICATION_STATUSES } from '@/lib/applications/applications-list'
import { userQueryOptions } from '@/lib/auth/user-query'
import { ApplicationsPage } from '@/pages/applications-page'

export const applicationsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  status: z.enum(APPLICATION_STATUSES).optional(),
})

export const Route = createFileRoute('/applications')({
  validateSearch: zodValidator(applicationsSearchSchema),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ApplicationsPage,
})
