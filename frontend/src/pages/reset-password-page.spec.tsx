import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { fetchMock } from '@/test-setup'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { submitWhenEnabled } from '@/test-utils/submit-when-enabled'

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
})

const rootRoute = createRootRoute()
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: zodValidator(resetPasswordSearchSchema),
  component: ResetPasswordPage,
})
const routeTree = rootRoute.addChildren([resetPasswordRoute])

async function fillPasswordFields(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ newPassword: string; confirmPassword: string }> = {},
) {
  const values = {
    newPassword: 'new-plain-text-password',
    confirmPassword: 'new-plain-text-password',
    ...overrides,
  }

  await user.type(
    await screen.findByLabelText('New Password'),
    values.newPassword,
  )
  await user.type(
    screen.getByLabelText('Confirm New Password'),
    values.confirmPassword,
  )
  await user.tab()
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ newPassword: string; confirmPassword: string }> = {},
) {
  await fillPasswordFields(user, overrides)
  await submitWhenEnabled(user, 'Reset Password')
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
  })

  it('renders new and confirm password fields', async () => {
    renderWithRouter(
      routeTree,
      new QueryClient(),
      '/reset-password?token=abc123',
    )

    expect(await screen.findByLabelText('New Password')).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.getByLabelText('Confirm New Password')).toHaveAttribute(
      'type',
      'password',
    )
  })

  it('shows a validation error when the passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      routeTree,
      new QueryClient(),
      '/reset-password?token=abc123',
    )

    await fillPasswordFields(user, { confirmPassword: 'different-password' })

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('submits the token from the URL and the new password to POST /auth/reset-password', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      routeTree,
      new QueryClient(),
      '/reset-password?token=abc123',
    )

    await fillAndSubmit(user)

    const call = fetchMock.mock.calls.find(([url]) =>
      (url as string).includes('/auth/reset-password'),
    )
    expect(call).toBeDefined()
    expect(JSON.parse(call?.[1]?.body as string)).toEqual({
      token: 'abc123',
      newPassword: 'new-plain-text-password',
    })
  })

  it('shows a success message and a link to login after a successful reset', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      routeTree,
      new QueryClient(),
      '/reset-password?token=abc123',
    )

    await fillAndSubmit(user)

    expect(
      await screen.findByText('Your password has been reset.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('shows the backend error message and a link back to forgot-password when the token is invalid or expired', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({ message: 'invalid or expired reset token' }),
      }),
    )
    const user = userEvent.setup()
    renderWithRouter(
      routeTree,
      new QueryClient(),
      '/reset-password?token=abc123',
    )

    await fillAndSubmit(user)

    expect(
      await screen.findByText('invalid or expired reset token'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Request a new reset link' }),
    ).toHaveAttribute('href', '/forgot-password')
  })
})
