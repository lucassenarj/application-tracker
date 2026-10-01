import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/profile-page'
import { userQueryOptions, type User } from '@/lib/auth/user-query'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})
const routeTree = rootRoute.addChildren([profileRoute])

const fakeUser: User = {
  id: '1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  avatar: 'https://example.com/avatar.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('ProfilePage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(userQueryOptions.queryKey, fakeUser)
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("shows the user's name, email, and avatar image in view mode by default", async () => {
    renderWithRouter(routeTree, queryClient, '/profile')

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.png',
    )
  })

  it('shows an initial-letter placeholder when no avatar URL is set', async () => {
    queryClient.setQueryData(userQueryOptions.queryKey, {
      ...fakeUser,
      avatar: undefined,
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    expect(await screen.findByRole('paragraph')).toHaveTextContent('J')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('clicking Edit shows the form pre-filled with the current name and avatar', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/profile')

    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(
      await screen.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('Jane Doe')
    expect(
      screen.getByRole('textbox', { name: 'Avatar URL' }),
    ).toHaveValue('https://example.com/avatar.png')
  })

  it('saving updates the values, shows a success confirmation, and returns to view mode', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, options) => {
      if ((options as RequestInit | undefined)?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...fakeUser,
              name: 'Jane Updated',
              avatar: 'https://example.com/new.png',
            }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeUser),
      })
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    const nameInput = await screen.findByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Updated')

    const avatarInput = screen.getByRole('textbox', { name: 'Avatar URL' })
    await user.clear(avatarInput)
    await user.type(avatarInput, 'https://example.com/new.png')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Profile updated.')).toBeInTheDocument()
    expect(screen.getByText('Jane Updated')).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument()
  })

  it('shows an error message when the update fails and stays in edit mode', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, options) => {
      if ((options as RequestInit | undefined)?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeUser),
      })
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Internal server error'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('clicking Cancel while editing discards changes and returns to view mode', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/profile')

    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    const nameInput = await screen.findByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Someone Else')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()

    const patchCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        (url as string).endsWith('/auth/me') &&
        (options as RequestInit | undefined)?.method === 'PATCH',
    )
    expect(patchCall).toBeUndefined()
  })
})
