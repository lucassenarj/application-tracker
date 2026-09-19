import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/lib/auth/user-query'

export const Route = createFileRoute('/login')({
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

function LoginPage() {
  return <h1>Login</h1>
}
