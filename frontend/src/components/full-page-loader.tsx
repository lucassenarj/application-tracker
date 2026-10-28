import { LoaderCircle } from 'lucide-react'

export function FullPageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
    >
      <LoaderCircle className="size-8 animate-spin text-primary" />
    </div>
  )
}
