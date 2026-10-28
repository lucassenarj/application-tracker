import { createRouter } from '@tanstack/react-router'
import { RouteLoadingBar } from './components/route-loading-bar'
import { queryClient } from './lib/query-client'
import { trackRouteChanges } from './lib/track-route-changes'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPendingComponent: RouteLoadingBar,
})

trackRouteChanges(router)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
