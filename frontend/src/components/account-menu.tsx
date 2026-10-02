import { Link } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'
import { useLogoutMutation } from '@/lib/auth/logout'
import type { User } from '@/lib/auth/user-query'

interface AccountMenuProps {
  user: User
}

export function AccountMenu({ user }: AccountMenuProps) {
  const logoutMutation = useLogoutMutation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" aria-label="Account menu">
            <UserAvatar user={user} className="h-8 w-8 text-sm" />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link to="/profile">Profile</Link>} />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
