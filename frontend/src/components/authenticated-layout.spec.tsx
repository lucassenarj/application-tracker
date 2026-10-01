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
  loginRoute,
])

const fakeUser: User = {
  id: '1',
  email: 'jane@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AuthenticatedLayout', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(userQueryOptions.queryKey, fakeUser)
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
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
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renders links to Dashboard and Applications', async () => {
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
  })

  it('logs out and navigates to /login when Logout is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Logout' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
