import { SidebarTrigger } from '@/components/ui/sidebar'

export function AppHeader() {
  return (
    <SidebarTrigger
      variant="default"
      className="fixed bottom-6 right-6 z-50 size-14 rounded-2xl shadow-lg md:hidden"
    />
  )
}
