import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { SecurityPage } from '@/pages/security-page'
import { fetchMock } from '@/test-setup'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const securityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/security',
  component: SecurityPage,
})
const routeTree = rootRoute.addChildren([securityRoute])

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }> = {},
) {
  const values = {
    currentPassword: 'current-password',
    newPassword: 'new-plain-text-password',
    confirmPassword: 'new-plain-text-password',
    ...overrides,
  }

  await user.type(screen.getByLabelText('Current Password'), values.currentPassword)
  await user.type(screen.getByLabelText('New Password'), values.newPassword)
  await user.type(
    screen.getByLabelText('Confirm New Password'),
    values.confirmPassword,
  )
  await user.click(screen.getByRole('button', { name: 'Update Password' }))
}

describe('SecurityPage', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
  })

  it('renders the page heading', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/security')

    expect(
      await screen.findByRole('heading', { name: 'Security' }),
    ).toBeInTheDocument()
  })

  it('renders the Change Password section with current, new, and confirm password fields', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/security')

    await screen.findByRole('heading', { name: 'Security' })

    expect(screen.getByLabelText('Current Password')).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.getByLabelText('New Password')).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.getByLabelText('Confirm New Password')).toHaveAttribute(
      'type',
      'password',
    )
  })

  it('defaults the "log out of all other sessions" checkbox to unchecked', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/security')

    await screen.findByRole('heading', { name: 'Security' })

    expect(
      screen.getByRole('checkbox', { name: /log out of all other sessions/i }),
    ).not.toBeChecked()
  })

  it('shows a validation error when the new password and confirm password do not match', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await fillAndSubmit(user, { confirmPassword: 'different-password' })

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('shows a validation error when the new password is too short', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await fillAndSubmit(user, { newPassword: 'short', confirmPassword: 'short' })

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
  })

  it('submits currentPassword, newPassword, and revokeOtherSessions to PATCH /auth/password', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await fillAndSubmit(user)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/password'),
      )
      expect(patchCall).toBeDefined()
      const body = JSON.parse(patchCall?.[1]?.body as string)
      expect(body).toEqual({
        currentPassword: 'current-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: false,
      })
    })
  })

  it('sends revokeOtherSessions as true when the checkbox is checked', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await user.click(
      screen.getByRole('checkbox', { name: /log out of all other sessions/i }),
    )
    await fillAndSubmit(user)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/password'),
      )
      const body = JSON.parse(patchCall?.[1]?.body as string)
      expect(body.revokeOtherSessions).toBe(true)
    })
  })

  it('shows a success message after a successful password change', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await fillAndSubmit(user)

    expect(
      await screen.findByText('Your password has been updated.'),
    ).toBeInTheDocument()
  })

  it('shows an error message when the current password is incorrect', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Current password is incorrect' }),
      }),
    )
    const user = userEvent.setup()
    renderWithRouter(routeTree, new QueryClient(), '/security')
    await screen.findByRole('heading', { name: 'Security' })

    await fillAndSubmit(user)

    expect(
      await screen.findByText('Current password is incorrect'),
    ).toBeInTheDocument()
  })
})
