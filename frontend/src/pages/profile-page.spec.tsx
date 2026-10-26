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
  phone: '+15551234567',
  bio: 'Backend engineer.',
  language: 'es',
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

  it('pre-fills the form with the current first name, last name, and shows the email as read-only', async () => {
    renderWithRouter(routeTree, queryClient, '/profile')

    expect(
      await screen.findByRole('textbox', { name: 'First Name' }),
    ).toHaveValue('Jane')
    expect(screen.getByRole('textbox', { name: 'Last Name' })).toHaveValue(
      'Doe',
    )

    const emailField = screen.getByRole('textbox', { name: 'Email Address' })
    expect(emailField).toHaveValue('jane@example.com')
    expect(emailField).toBeDisabled()
  })

  it('clicking the avatar edit icon reveals the Avatar URL field pre-filled with the current value', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/profile')

    expect(
      screen.queryByRole('textbox', { name: 'Avatar URL' }),
    ).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Edit avatar' }))

    expect(
      screen.getByRole('textbox', { name: 'Avatar URL' }),
    ).toHaveValue('https://example.com/avatar.png')
  })
  it('shows an initial-letter placeholder in the avatar when no avatar URL is set', async () => {
    queryClient.setQueryData(userQueryOptions.queryKey, {
      ...fakeUser,
      avatar: undefined,
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    expect(await screen.findByRole('paragraph')).toHaveTextContent('J')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('saving combines first and last name, sends the update, and shows a success confirmation', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, options) => {
      if ((options as RequestInit | undefined)?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...fakeUser, name: 'Jane Updated' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeUser),
      })
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    const lastNameInput = await screen.findByRole('textbox', {
      name: 'Last Name',
    })
    await user.clear(lastNameInput)
    await user.type(lastNameInput, 'Updated')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Profile updated.')).toBeInTheDocument()

    const patchCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        (url as string).endsWith('/auth/me') &&
        (options as RequestInit | undefined)?.method === 'PATCH',
    )
    const body = JSON.parse(patchCall?.[1]?.body as string)
    expect(body.name).toBe('Jane Updated')
  })
  it('shows an error message when the update fails', async () => {
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

    await screen.findByRole('textbox', { name: 'First Name' })
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('Internal server error'),
    ).toBeInTheDocument()
  })

  it('shows the total number of applications tracked', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/applications/stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ total: 3, inProgress: 1, offers: 1, rejections: 1 }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(fakeUser) })
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    expect(
      await screen.findByText('3 applications tracked'),
    ).toBeInTheDocument()
  })

  it('clicking Cancel resets the form to the original values', async () => {
    const user = userEvent.setup()
    renderWithRouter(routeTree, queryClient, '/profile')

    const lastNameInput = await screen.findByRole('textbox', {
      name: 'Last Name',
    })
    await user.clear(lastNameInput)
    await user.type(lastNameInput, 'Someone Else')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(lastNameInput).toHaveValue('Doe')

    const patchCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        (url as string).endsWith('/auth/me') &&
        (options as RequestInit | undefined)?.method === 'PATCH',
    )
    expect(patchCall).toBeUndefined()
  })

  it('pre-fills the phone, bio, and language fields from the current user', async () => {
    renderWithRouter(routeTree, queryClient, '/profile')

    expect(
      await screen.findByRole('textbox', { name: 'Phone Number' }),
    ).toHaveValue('+15551234567')
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveValue(
      'Backend engineer.',
    )
    expect(
      screen.getByRole('combobox', { name: 'Language' }),
    ).toHaveTextContent('Spanish')
  })

  it('saving sends the updated phone, bio, and language values', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, options) => {
      if ((options as RequestInit | undefined)?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeUser),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeUser),
      })
    })

    renderWithRouter(routeTree, queryClient, '/profile')

    const phoneInput = await screen.findByRole('textbox', {
      name: 'Phone Number',
    })
    await user.clear(phoneInput)
    await user.type(phoneInput, '+447911123456')

    const bioInput = screen.getByRole('textbox', { name: 'Bio' })
    await user.clear(bioInput)
    await user.type(bioInput, 'Updated bio.')

    await user.click(screen.getByRole('combobox', { name: 'Language' }))
    await user.click(await screen.findByRole('option', { name: 'French' }))

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await screen.findByText('Profile updated.')

    const patchCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        (url as string).endsWith('/auth/me') &&
        (options as RequestInit | undefined)?.method === 'PATCH',
    )
    const body = JSON.parse(patchCall?.[1]?.body as string)
    expect(body.phone).toBe('+447911123456')
    expect(body.bio).toBe('Updated bio.')
    expect(body.language).toBe('fr')
  })
})
