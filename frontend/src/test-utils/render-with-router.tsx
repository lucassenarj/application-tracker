import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import type { AnyRoute } from '@tanstack/react-router'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

export function renderWithRouter(
  routeTree: AnyRoute,
  queryClient: QueryClient,
  initialPath: string | string[],
) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({
      initialEntries: Array.isArray(initialPath) ? initialPath : [initialPath],
    }),
  })

  return {
    ...render(
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>,
    ),
    router,
  }
}
