import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRootRouteWithContext,
  createRoute,
  redirect,
} from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/authenticated-layout'
import { userQueryOptions, type User } from '@/lib/auth/user-query'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { fetchMock } from '@/test-setup'

interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()()
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: AuthenticatedLayout,
})
const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications',
  component: () => <div>Applications page</div>,
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <div>Profile page</div>,
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .ensureQueryData(userQueryOptions)
      .catch(() => null)

    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <div>Login page</div>,
})
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  applicationsRoute,
  profileRoute,
  loginRoute,
])

const fakeUser: User = {
  id: '1',
  email: 'jane@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AuthenticatedLayout', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(userQueryOptions.queryKey, fakeUser)
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/logout')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.reject(new SyntaxError('Unexpected end of JSON input')),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })
    })
  })

  it('renders the sidebar nav and the header', async () => {
    renderWithRouter(routeTree, queryClient, '/dashboard')

    expect(
      await screen.findByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Applications' })).toHaveAttribute(
      'href',
      '/applications?page=1',
    )
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(
      screen.getByRole('link', { name: 'Application Tracker' }),
    ).toHaveAttribute('href', '/dashboard')
  })

  it('shows the loading bar while the user is loading', async () => {
    const pendingQueryClient = new QueryClient()
    renderWithRouter(routeTree, pendingQueryClient, '/dashboard')

    expect(
      await screen.findByRole('status', { name: 'Loading' }),
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
