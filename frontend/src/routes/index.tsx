import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    throw redirect({ to: user ? '/dashboard' : '/login' })
  },
})
