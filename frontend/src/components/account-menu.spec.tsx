import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AccountMenu } from '@/components/account-menu'
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
      <AccountMenu user={fakeUser} />
    </SidebarProvider>
  ),
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <div>Profile page</div>,
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <div>Login page</div>,
})
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  profileRoute,
  loginRoute,
])

describe('AccountMenu', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shows Profile and Logout options', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Account menu' }),
    )

    expect(
      await screen.findByRole('menuitem', { name: 'Profile' }),
    ).toHaveAttribute('href', '/profile')
    expect(
      screen.getByRole('menuitem', { name: 'Logout' }),
    ).toBeInTheDocument()
  })

  it('logs out and navigates to /login when Logout is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    await user.click(
      await screen.findByRole('button', { name: 'Account menu' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Logout' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
