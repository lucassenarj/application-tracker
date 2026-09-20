import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { RegisterPage } from '@/pages/register-page'

const routeTree = buildRouteTree({
  '/register': RegisterPage,
  '/login': () => <div>Login page</div>,
  '/dashboard': () => <div>Dashboard page</div>,
})

describe('RegisterPage', () => {
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
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renders the email and password fields and a submit button', async () => {
    renderWithRouter(routeTree, queryClient, '/register')

    expect(
      await screen.findByRole('textbox', { name: 'Email' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Register' }),
    ).toBeInTheDocument()
  })
  it('shows a validation error when submitting with an invalid email', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Email' }),
      'not-an-email',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
  })
  it('shows a validation error when submitting with a password shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
  })
  it('shows an error alert when the register request fails', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({ message: 'a User with this email already exists' }),
      })
    })

    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(
      await screen.findByText('a User with this email already exists'),
    ).toBeInTheDocument()
  })
  it('logs in automatically and navigates to /dashboard when registration succeeds', async () => {
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
          Promise.resolve({
            id: '1',
            email: 'jane@example.com',
            createdAt: new Date().toISOString(),
          }),
      })
    })

    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument()
  })
})
