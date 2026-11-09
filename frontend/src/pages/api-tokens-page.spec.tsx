import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { ApiTokensPage } from '@/pages/api-tokens-page'
import { fetchMock } from '@/test-setup'
import { renderWithRouter } from '@/test-utils/render-with-router'
import type { PersonalAccessToken } from '@/lib/auth/personal-access-tokens'

const rootRoute = createRootRoute()
const apiTokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-tokens',
  component: ApiTokensPage,
})
const routeTree = rootRoute.addChildren([apiTokensRoute])

function buildToken(
  overrides: Partial<PersonalAccessToken> = {},
): PersonalAccessToken {
  return {
    id: 'token-1',
    label: 'LinkedIn extension',
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

function mockTokensList(tokens: PersonalAccessToken[]) {
  fetchMock.mockImplementation(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(tokens) }),
  )
}

describe('ApiTokensPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('renders the page heading', async () => {
    mockTokensList([])
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    expect(
      await screen.findByRole('heading', { name: 'API Tokens' }),
    ).toBeInTheDocument()
  })

  it('shows "No tokens yet" when the list is empty', async () => {
    mockTokensList([])
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    expect(await screen.findByText(/no tokens yet/i)).toBeInTheDocument()
  })

  it('shows the token list once loaded', async () => {
    mockTokensList([buildToken()])
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    expect(await screen.findByText('LinkedIn extension')).toBeInTheDocument()
    expect(screen.getByText('Never')).toBeInTheDocument()
    expect(screen.getByText('Never used')).toBeInTheDocument()
    expect(screen.getByText('Valid')).toBeInTheDocument()
  })

  it('shows a "Revoked" badge and no Revoke button for a revoked token', async () => {
    mockTokensList([buildToken({ revokedAt: '2026-02-01T00:00:00.000Z' })])
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    expect(await screen.findByText('Revoked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Revoke' }),
    ).not.toBeInTheDocument()
  })

  it('clicking Revoke opens a confirmation dialog', async () => {
    mockTokensList([buildToken()])
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    await user.click(await screen.findByRole('button', { name: 'Revoke' }))

    expect(
      await screen.findByRole('heading', { name: 'Revoke this token?' }),
    ).toBeInTheDocument()
  })

  it('confirming revoke calls DELETE on the token', async () => {
    mockTokensList([buildToken()])
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    await user.click(await screen.findByRole('button', { name: 'Revoke' }))
    await user.click(await screen.findByRole('button', { name: 'Yes, Revoke' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, options]) =>
          (url as string).includes('/auth/personal-access-tokens/token-1') &&
          (options as RequestInit)?.method === 'DELETE',
      )
      expect(call).toBeDefined()
    })
  })

  it('canceling the confirmation does not call DELETE', async () => {
    mockTokensList([buildToken()])
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/api-tokens')

    await user.click(await screen.findByRole('button', { name: 'Revoke' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    const call = fetchMock.mock.calls.find(
      ([, options]) => (options as RequestInit)?.method === 'DELETE',
    )
    expect(call).toBeUndefined()
  })
})
