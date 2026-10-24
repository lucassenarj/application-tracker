import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { FullPageLoader } from '@/components/full-page-loader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { userQueryOptions } from '@/lib/auth/user-query'

export function AuthenticatedLayout() {
  const userQuery = useQuery(userQueryOptions)
  const user = userQuery.data

  if (!user) {
    return <FullPageLoader />
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="bg-transparent">
        <AppHeader />
        <div className="flex flex-1 flex-col p-[30px]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
