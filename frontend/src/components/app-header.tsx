import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <SidebarTrigger />
      <div className="flex items-center gap-[15px]">
        <ThemeToggle />
      </div>
    </header>
  )
}
