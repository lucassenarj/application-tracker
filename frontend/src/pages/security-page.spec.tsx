import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { SecurityPage } from '@/pages/security-page'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const securityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/security',
  component: SecurityPage,
})
const routeTree = rootRoute.addChildren([securityRoute])

describe('SecurityPage', () => {
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
  it('renders the Two-Factor Authentication toggles', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/security')

    await screen.findByRole('heading', { name: 'Security' })

    expect(
      screen.getByRole('switch', { name: 'Enable 2FA' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('switch', { name: 'SMS Authentication' }),
    ).toBeChecked()
    expect(
      screen.getByRole('switch', { name: 'Authenticator App' }),
    ).not.toBeChecked()
  })
  it('renders the Active Sessions list with a badge for the current session and Revoke buttons for the others', async () => {
    renderWithRouter(routeTree, new QueryClient(), '/security')

    await screen.findByRole('heading', { name: 'Security' })

    expect(screen.getByText('Chrome on MacOS')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Safari on iPhone')).toBeInTheDocument()
    expect(screen.getByText('Firefox on Windows')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(2)
  })
})
