import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/applications')({
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

function ApplicationsPage() {
  return <h1>Applications</h1>
}
