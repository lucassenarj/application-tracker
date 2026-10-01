import { Link, Outlet } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useLogoutMutation } from '@/lib/auth/logout'

export function AuthenticatedLayout() {
  const logoutMutation = useLogoutMutation()

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center justify-between border-b pb-4">
        <div className="flex gap-4">
          <Link
            to="/dashboard"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Dashboard
          </Link>
          <Link
            to="/applications"
            search={{ page: 1 }}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Applications
          </Link>
          <Link
            to="/profile"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Profile
          </Link>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </nav>
      <Outlet />
    </div>
  )
}
