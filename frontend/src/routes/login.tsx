import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/pages/login-page'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Login - Application Tracker' }],
  }),
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
