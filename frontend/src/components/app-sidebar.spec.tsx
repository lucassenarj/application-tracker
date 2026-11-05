import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
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
      <AppSidebar user={fakeUser} />
    </SidebarProvider>
  ),
})
const routeTree = rootRoute.addChildren([dashboardRoute])

describe('AppSidebar', () => {
  it('renders a link to the dashboard on the wordmark', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Application Tracker' }),
    ).toHaveAttribute('href', '/dashboard')
  })

  it('renders links to Dashboard, Applications, Profile, and Security', async () => {
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
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute(
      'href',
      '/security',
    )
  })

  it('groups nav links under Main Menu and Account section labels', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(await screen.findByText('Main Menu')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('marks the current route as active', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('data-active')
  })

  it('renders the account menu in the sidebar footer', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('button', { name: 'Account menu' }),
    ).toBeInTheDocument()
  })
})
