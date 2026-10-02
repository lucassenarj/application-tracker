import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { LoginPage } from '@/pages/login-page'

const routeTree = buildRouteTree({
  '/login': LoginPage,
  '/register': () => <div>Register page</div>,
  '/dashboard': () => <div>Dashboard page</div>,
})

describe('LoginPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient()
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

  it('renders the email and password fields and a submit button', async () => {
    renderWithRouter(routeTree, queryClient, '/login')

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })
  it('toggles the password field between hidden and visible', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/login')

    expect(await screen.findByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )

    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
  it('shows a validation error when submitting with an invalid email', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/login')

    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
  })
  it('shows a validation error when submitting with an empty password', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/login')

    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Password is required')).toBeInTheDocument()
  })
  it('shows an error alert when the login request fails', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'invalid credentials' }),
      }),
    )

    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/login')

    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('invalid credentials')).toBeInTheDocument()
  })
  it('navigates to /dashboard when login succeeds', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '1',
            email: 'jane@example.com',
            createdAt: new Date().toISOString(),
          }),
      }),
    )

    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/login')

    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument()
  })
})
