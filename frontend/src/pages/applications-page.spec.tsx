import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { ApplicationsPage } from '@/pages/applications-page'
import { applicationsSearchSchema } from '@/routes/_authenticated.applications'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { formatRelativeTime } from '@/lib/relative-time'
import type { ApplicationListItem } from '@/lib/applications/applications-list'

const rootRoute = createRootRoute()
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '/_authenticated',
})
const applicationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/applications',
  validateSearch: zodValidator(applicationsSearchSchema),
  component: ApplicationsPage,
})
const applicationDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/applications/$id',
  component: () => <div>Application Detail page</div>,
})
const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([applicationsRoute, applicationDetailRoute]),
])

function buildApplicationListItem(
  overrides: Partial<ApplicationListItem> = {},
): ApplicationListItem {
  return {
    id: '1',
    title: 'Senior Backend Engineer',
    companyName: 'Acme Corp',
    currentStatus: 'APPLIED',
    availableTransitions: [],
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('ApplicationsPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('table', () => {
    it('renders loading skeletons while pending', async () => {
      fetchMock.mockImplementation(() => new Promise(() => {}))

      const { container } = renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1',
      )

      await screen.findByRole('heading', { name: 'Applications' })
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })

    it("renders each application's title, company name, formatted status, and date", async () => {
      const items = [
        buildApplicationListItem({ currentStatus: 'INTERVIEW_SCHEDULED' }),
        buildApplicationListItem({
          id: '2',
          title: 'Frontend Developer',
          companyName: 'Globex',
          currentStatus: 'APPLIED',
          createdAt: '2026-02-01T10:00:00.000Z',
          updatedAt: '2026-02-01T10:00:00.000Z',
        }),
      ]
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items, total: items.length }),
        }),
      )

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      const firstRow = (
        await screen.findByText('Senior Backend Engineer')
      ).closest('tr')!
      expect(within(firstRow).getByText('Acme Corp')).toBeInTheDocument()
      expect(
        within(firstRow).getByText('Interview Scheduled'),
      ).toBeInTheDocument()
      expect(
        within(firstRow).getByText(
          new Date(items[0].createdAt).toLocaleDateString(),
        ),
      ).toBeInTheDocument()
      expect(
        within(firstRow).getByText(
          formatRelativeTime(new Date(items[0].updatedAt)),
        ),
      ).toBeInTheDocument()

      const secondRow = screen.getByText('Frontend Developer').closest('tr')!
      expect(within(secondRow).getByText('Globex')).toBeInTheDocument()
      expect(within(secondRow).getByText('Applied')).toBeInTheDocument()
      expect(
        within(secondRow).getByText(
          new Date(items[1].createdAt).toLocaleDateString(),
        ),
      ).toBeInTheDocument()
    })
    it('shows "No applications yet." when the list is empty', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      expect(
        await screen.findByText('No applications yet.'),
      ).toBeInTheDocument()
    })
    it('shows an error message when the request fails', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        }),
      )

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      expect(
        await screen.findByText(
          "Couldn't load your applications. Try refreshing the page.",
        ),
      ).toBeInTheDocument()
    })
  })

  describe('category filter', () => {
    it('renders All, In Progress, Offers, and Rejections tabs', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByRole('heading', { name: 'Applications' })

      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'In Progress' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Offers' })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Rejections' }),
      ).toBeInTheDocument()
    })

    it('selecting a tab filters the list and resets to page 1', async () => {
      const user = userEvent.setup()

      renderWithRouter(routeTree, queryClient, '/applications?page=2')

      await user.click(await screen.findByRole('tab', { name: 'Offers' }))

      await screen.findByText('No applications yet.')

      const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0] as string
      expect(lastCallUrl).toContain('page=1')
      expect(lastCallUrl).toContain('category=OFFERS')
    })

    it('replaces the history entry instead of pushing a new one when filtering', async () => {
      const user = userEvent.setup()

      const { router } = renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1',
      )

      await user.click(await screen.findByRole('tab', { name: 'Offers' }))
      await screen.findByText('No applications yet.')

      await user.click(await screen.findByRole('tab', { name: 'Rejections' }))
      await screen.findByText('No applications yet.')

      expect(router.history.length).toBe(1)
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [buildApplicationListItem()],
              total: 25,
            }),
        }),
      )
    })

    it('disables the Previous button on page 1', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('Senior Backend Engineer')

      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    })
    it('disables the Next button on the last page', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=3')

      await screen.findByText('Senior Backend Engineer')

      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    })
    it('clicking Next advances to page 2', async () => {
      const user = userEvent.setup()

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('Page 1 of 3')
      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it("clicking a row navigates to the application's detail page", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [buildApplicationListItem({ id: 'abc123' })],
            total: 1,
          }),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/applications?page=1')

    await user.click(await screen.findByText('Senior Backend Engineer'))

    expect(
      await screen.findByText('Application Detail page'),
    ).toBeInTheDocument()
  })

  it('clicking the View button navigates to the application\'s detail page', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [buildApplicationListItem({ id: 'abc123' })],
            total: 1,
          }),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/applications?page=1')

    await user.click(await screen.findByRole('button', { name: 'View' }))

    expect(
      await screen.findByText('Application Detail page'),
    ).toBeInTheDocument()
  })

  describe('search', () => {
    it("renders a search input, pre-filled from the URL's search param if present", async () => {
      renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1&search=backend',
      )

      expect(
        await screen.findByRole('textbox', {
          name: 'Search by title or company',
        }),
      ).toHaveValue('backend')
    })

    it('does not fetch immediately when typing — only the initial load has happened before the debounce delay elapses', async () => {
      const user = userEvent.setup()
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('No applications yet.')
      const callCountBeforeTyping = fetchMock.mock.calls.length

      await user.type(
        screen.getByRole('textbox', { name: 'Search by title or company' }),
        'backend',
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350))
      })

      expect(fetchMock.mock.calls.length).toBe(callCountBeforeTyping)
    })

    it('fetches with the typed search term after the debounce delay, resetting to page 1', async () => {
      const user = userEvent.setup()
      renderWithRouter(routeTree, queryClient, '/applications?page=2')

      await screen.findByText('No applications yet.')

      await user.type(
        screen.getByRole('textbox', { name: 'Search by title or company' }),
        'backend',
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 410))
      })

      const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0] as string
      expect(lastCallUrl).toContain('search=backend')
      expect(lastCallUrl).toContain('page=1')
    })

    it('shows a loading indicator while a search request is in flight', async () => {
      const user = userEvent.setup()
      let listCallCount = 0
      let resolveSearchFetch: (() => void) | undefined
      fetchMock.mockImplementation((url: string) => {
        if (!url.includes('/applications?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [], total: 0 }),
          })
        }
        listCallCount += 1
        if (listCallCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [], total: 0 }),
          })
        }
        return new Promise((resolve) => {
          resolveSearchFetch = () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ items: [], total: 0 }),
            })
        })
      })

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('No applications yet.')

      await user.type(
        screen.getByRole('textbox', { name: 'Search by title or company' }),
        'backend',
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 410))
      })

      expect(await screen.findByText('Searching...')).toBeInTheDocument()

      resolveSearchFetch?.()

      await waitFor(() => {
        expect(screen.queryByText('Searching...')).not.toBeInTheDocument()
      })
    })

    it('clearing the search input returns to the unfiltered list', async () => {
      const user = userEvent.setup()
      fetchMock.mockImplementation((url: string) => {
        const hasSearch = url.includes('search=')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              hasSearch
                ? { items: [], total: 0 }
                : { items: [buildApplicationListItem()], total: 1 },
            ),
        })
      })

      renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1&search=backend',
      )

      await screen.findByText('No applications yet.')

      const searchInput = screen.getByRole('textbox', {
        name: 'Search by title or company',
      })
      await user.clear(searchInput)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 410))
      })

      expect(
        await screen.findByText('Senior Backend Engineer'),
      ).toBeInTheDocument()
    })

    it('changing the category filter while a search term is active preserves the search term', async () => {
      const user = userEvent.setup()

      renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1&search=backend',
      )

      await screen.findByText('No applications yet.')

      await user.click(screen.getByRole('tab', { name: 'Offers' }))

      await waitFor(() => {
        const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0] as string
        expect(lastCallUrl).toContain('search=backend')
        expect(lastCallUrl).toContain('category=OFFERS')
      })
    })

    it("shows the result matching the latest search term even if an earlier search's response resolves after a later one's", async () => {
      const user = userEvent.setup()
      const pendingResolvers: Record<string, () => void> = {}

      fetchMock.mockImplementation((url: string) => {
        if (url.includes('search=foo')) {
          return new Promise((resolve) => {
            pendingResolvers.foo = () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    items: [
                      buildApplicationListItem({
                        id: 'foo-1',
                        title: 'Foo Result',
                        companyName: 'Foo Co',
                      }),
                    ],
                    total: 1,
                  }),
              })
          })
        }
        if (url.includes('search=bar')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                items: [
                  buildApplicationListItem({
                    id: 'bar-1',
                    title: 'Bar Result',
                    companyName: 'Bar Co',
                  }),
                ],
                total: 1,
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('No applications yet.')

      const searchInput = screen.getByRole('textbox', {
        name: 'Search by title or company',
      })

      await user.type(searchInput, 'foo')
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 410))
      })

      await user.clear(searchInput)
      await user.type(searchInput, 'bar')
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 410))
      })

      expect(await screen.findByText('Bar Result')).toBeInTheDocument()

      pendingResolvers.foo?.()
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(screen.getByText('Bar Result')).toBeInTheDocument()
      expect(screen.queryByText('Foo Result')).not.toBeInTheDocument()
    })
  })
})
