import { createFileRoute, redirect } from '@tanstack/react-router'
import { FullPageLoader } from '@/components/full-page-loader'
import { LoginPage } from '@/pages/login-page'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Login - Application Tracker' }],
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
  component: LoginPage,
})
