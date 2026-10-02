import { ThemeToggle } from '@/components/theme-toggle'

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="font-semibold">Application Tracker</span>
      <ThemeToggle />
    </header>
  )
}
