import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { RegisterPage } from '@/pages/register-page'
import { fetchMock } from '@/test-setup'
import { submitWhenEnabled } from '@/test-utils/submit-when-enabled'

const routeTree = buildRouteTree({
  '/register': RegisterPage,
  '/login': () => <div>Login page</div>,
  '/dashboard': () => <div>Dashboard page</div>,
})

describe('RegisterPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
  })

  async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
      await screen.findByRole('textbox', { name: 'Full Name' }),
      'Jane Doe',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'plain-text-password',
    )
    await user.tab()
  }

  it('renders the name, email, password, and confirm password fields and a submit button', async () => {
    renderWithRouter(routeTree, queryClient, '/register')

    expect(
      await screen.findByRole('textbox', { name: 'Full Name' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create Account' }),
    ).toBeInTheDocument()
  })
  it('toggles the password field between hidden and visible', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    expect(await screen.findByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )

    const [showPasswordButton] = screen.getAllByRole('button', {
      name: 'Show password',
    })
    await user.click(showPasswordButton)

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
  it('shows a validation error when submitting without a full name', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'plain-text-password',
    )
    await user.click(screen.getByRole('textbox', { name: 'Full Name' }))
    await user.tab()

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })
  it('shows a validation error when submitting with an invalid email', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Full Name' }),
      'Jane Doe',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'not-an-email',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'plain-text-password',
    )
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
  })
  it('shows a validation error when submitting with a password shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Full Name' }),
      'Jane Doe',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
  })
  it('shows a validation error when the confirm password does not match', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')

    await user.type(
      await screen.findByRole('textbox', { name: 'Full Name' }),
      'Jane Doe',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'jane@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'plain-text-password')
    await user.type(screen.getByLabelText('Confirm Password'), 'different')
    await user.tab()

    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument()
  })
  it('shows an error alert when the register request fails', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({ message: 'a User with this email already exists' }),
      }),
    )

    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/register')
    await fillValidForm(user)

    await submitWhenEnabled(user, 'Create Account')

    expect(
      await screen.findByText('a User with this email already exists'),
    ).toBeInTheDocument()
  })
  it('shows a check-your-email success message and does not log in or navigate to /dashboard', async () => {
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
    renderWithRouter(routeTree, queryClient, '/register')
    await fillValidForm(user)

    await submitWhenEnabled(user, 'Create Account')

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument()

    const loginCall = fetchMock.mock.calls.find(([url]) =>
      (url as string).includes('/auth/login'),
    )
    expect(loginCall).toBeUndefined()
  })
})
