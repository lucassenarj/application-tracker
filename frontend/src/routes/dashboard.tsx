import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  return <h1>Dashboard</h1>
}
