import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { fetchMock } from '@/test-setup'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { submitWhenEnabled } from '@/test-utils/submit-when-enabled'

const rootRoute = createRootRoute()
const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})
const routeTree = rootRoute.addChildren([forgotPasswordRoute])

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
  })

  it('renders an email field and submit button', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/forgot-password')

    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send Reset Link' }),
    ).toBeInTheDocument()
  })

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/forgot-password')

    await user.type(await screen.findByLabelText('Email'), 'not-an-email')
    await user.tab()

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
  })

  it('submits the email to POST /auth/forgot-password', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/forgot-password')

    await user.type(await screen.findByLabelText('Email'), 'jane@example.com')
    await user.tab()
    await submitWhenEnabled(user, 'Send Reset Link')

    await screen.findByText(
      'If an account exists for that email, a reset link was sent.',
    )
    const call = fetchMock.mock.calls.find(([url]) =>
      (url as string).includes('/auth/forgot-password'),
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toEqual({
      email: 'jane@example.com',
    })
  })

  it('shows the same generic message regardless of whether the account exists', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/forgot-password')

    await user.type(
      await screen.findByLabelText('Email'),
      'nonexistent@example.com',
    )
    await user.tab()
    await submitWhenEnabled(user, 'Send Reset Link')

    expect(
      await screen.findByText(
        'If an account exists for that email, a reset link was sent.',
      ),
    ).toBeInTheDocument()
  })

  it('shows an error message when the request itself fails', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      }),
    )
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/forgot-password')

    await user.type(await screen.findByLabelText('Email'), 'jane@example.com')
    await user.tab()
    await submitWhenEnabled(user, 'Send Reset Link')

    expect(
      await screen.findByText('Internal server error'),
    ).toBeInTheDocument()
  })
})
