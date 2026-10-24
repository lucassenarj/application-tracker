import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <SidebarProvider>
      <AppHeader />
    </SidebarProvider>
  ),
})
const routeTree = rootRoute.addChildren([dashboardRoute])

describe('AppHeader', () => {
  it('renders the sidebar trigger on the left and the theme toggle on the right', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Toggle Sidebar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Toggle theme' }),
    ).toBeInTheDocument()
  })
})
