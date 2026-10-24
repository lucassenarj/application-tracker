import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { AnimatedBackground } from '@/components/animated-background'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [{ title: 'Application Tracker' }],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeadContent />
      <AnimatedBackground />
      <main className="flex-1">
        <Outlet />
      </main>
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}
