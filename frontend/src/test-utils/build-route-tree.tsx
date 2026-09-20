import type { RouteComponent } from '@tanstack/react-router'
import { createRootRoute, createRoute } from '@tanstack/react-router'

export function buildRouteTree(routes: Record<string, RouteComponent>) {
  const rootRoute = createRootRoute()
  const childRoutes = Object.entries(routes).map(([path, component]) =>
    createRoute({ getParentRoute: () => rootRoute, path, component }),
  )

  return rootRoute.addChildren(childRoutes)
}
