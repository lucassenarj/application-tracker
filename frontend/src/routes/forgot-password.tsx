import { createFileRoute, redirect } from '@tanstack/react-router'
import { FullPageLoader } from '@/components/full-page-loader'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/forgot-password')({
  head: () => ({
    meta: [{ title: 'Forgot Password - Application Tracker' }],
  }),
  pendingComponent: FullPageLoader,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ForgotPasswordPage,
})
