import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterPage } from '@/pages/register-page'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/register')({
  head: () => ({
    meta: [{ title: 'Register - Application Tracker' }],
  }),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RegisterPage,
})
