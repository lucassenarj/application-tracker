import { createFileRoute, redirect } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { FullPageLoader } from '@/components/full-page-loader'
import { VerifyEmailPage } from '@/pages/verify-email-page'
import { userQueryOptions } from '@/lib/auth/user-query'

const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/verify-email')({
  head: () => ({
    meta: [{ title: 'Verify Email - Application Tracker' }],
  }),
  validateSearch: zodValidator(verifyEmailSearchSchema),
  pendingComponent: FullPageLoader,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: VerifyEmailPage,
})
