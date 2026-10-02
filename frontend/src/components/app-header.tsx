import { Link } from '@tanstack/react-router'
import { AccountMenu } from '@/components/account-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { User } from '@/lib/auth/user-query'

interface AppHeaderProps {
  user: User
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link to="/dashboard" className="font-semibold">
          Application Tracker
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}
