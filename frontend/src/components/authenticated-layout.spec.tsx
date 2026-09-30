import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthenticatedLayout } from '@/components/authenticated-layout'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'

const routeTree = buildRouteTree({
  '/dashboard': AuthenticatedLayout,
  '/applications': () => <div>Applications page</div>,
  '/login': () => <div>Login page</div>,
})

describe('AuthenticatedLayout', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.reject(new SyntaxError('Unexpected end of JSON input')),
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
  })

  it('logs out and navigates to /login when Logout is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Logout' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
