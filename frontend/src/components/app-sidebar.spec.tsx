import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  ),
})
const routeTree = rootRoute.addChildren([dashboardRoute])

describe('AppSidebar', () => {
  it('renders links to Dashboard, Applications, and Profile', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
    expect(
      screen.getByRole('link', { name: 'Applications' }),
    ).toHaveAttribute('href', '/applications?page=1')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile',
    )
  })

  it('marks the current route as active', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('data-active')
  })
})
