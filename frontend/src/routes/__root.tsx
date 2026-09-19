import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-4 py-3">
        <span className="font-semibold">Application Tracker</span>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}
