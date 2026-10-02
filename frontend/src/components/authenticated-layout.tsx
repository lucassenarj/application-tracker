import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { userQueryOptions } from '@/lib/auth/user-query'

export function AuthenticatedLayout() {
  const userQuery = useQuery(userQueryOptions)
  const user = userQuery.data

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} />
        <div className="flex flex-1 flex-col p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
