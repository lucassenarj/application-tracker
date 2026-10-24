import { Link } from '@tanstack/react-router'
import { ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton } from '@/components/ui/sidebar'
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
          <SidebarMenuButton size="lg" aria-label="Account menu">
            <UserAvatar user={user} className="h-8 w-8 text-sm" />
            <div className="flex flex-col overflow-hidden text-left">
              <span className="truncate text-sm font-medium">
                {user.name || user.email}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0" />
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuItem render={<Link to="/profile">Profile</Link>} />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
