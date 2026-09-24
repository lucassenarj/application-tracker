import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/applications_/$id')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ApplicationDetailPage,
})

function ApplicationDetailPage() {
  return <h1>Application Detail</h1>
}
