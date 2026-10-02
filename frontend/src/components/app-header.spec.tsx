import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { User } from '@/lib/auth/user-query'
import { renderWithRouter } from '@/test-utils/render-with-router'

const fakeUser: User = {
  id: '1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const rootRoute = createRootRoute()
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <SidebarProvider>
      <AppHeader user={fakeUser} />
    </SidebarProvider>
  ),
})
const routeTree = rootRoute.addChildren([dashboardRoute])

describe('AppHeader', () => {
  it('renders the app name on the left and the theme/account controls on the right', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Application Tracker' }),
    ).toHaveAttribute('href', '/dashboard')
    expect(
      screen.getByRole('button', { name: 'Toggle theme' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Account menu' }),
    ).toBeInTheDocument()
  })
})
