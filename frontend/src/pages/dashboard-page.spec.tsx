import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { DashboardPage } from '@/pages/dashboard-page'
import type { ApplicationListItem } from '@/lib/dashboard/applications-list'

const routeTree = buildRouteTree({
  '/dashboard': DashboardPage,
  '/applications': () => <div>Applications page</div>,
  '/applications/$id': () => <div>Application Detail page</div>,
})

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
    ...overrides,
  }
}

describe('DashboardPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/applications/stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('summary cards', () => {
    it('renders loading skeletons while stats are pending', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return new Promise(() => {})
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      const { container } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await screen.findByText('No applications yet.')
      expect(screen.queryByText('Total')).not.toBeInTheDocument()
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })

    it('renders the four summary cards with the loaded stats values', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('Total')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Offers')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Rejections')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('clicking a category card navigates to the Applications list filtered by that category', async () => {
      const user = userEvent.setup()
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      const { router } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(await screen.findByText('In Progress'))

      expect(await screen.findByText('Applications page')).toBeInTheDocument()
      expect(router.state.location.search).toMatchObject({
        page: 1,
        category: 'IN_PROGRESS',
      })
    })

    it('clicking the Total card navigates to the Applications list with no category filter', async () => {
      const user = userEvent.setup()
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      const { router } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(await screen.findByText('Total'))

      expect(await screen.findByText('Applications page')).toBeInTheDocument()
      expect(router.state.location.search).not.toHaveProperty('category')
    })

    it('shows an error message when the stats request fails', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'Internal server error' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(
        await screen.findByText("Couldn't load your stats. Try refreshing the page."),
      ).toBeInTheDocument()
    })
  })

  describe('latest applications list', () => {
    it('renders loading skeletons while pending', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
          })
        }
        return new Promise(() => {})
      })

      const { container } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await screen.findByText('Total')
      expect(screen.queryByText('No applications yet.')).not.toBeInTheDocument()
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
        }),
      ]
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items, total: items.length }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('Senior Backend Engineer')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Interview Scheduled')).toBeInTheDocument()
      expect(
        screen.getByText(new Date(items[0].createdAt).toLocaleDateString()),
      ).toBeInTheDocument()

      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Globex')).toBeInTheDocument()
      expect(screen.getByText('Applied')).toBeInTheDocument()
      expect(
        screen.getByText(new Date(items[1].createdAt).toLocaleDateString()),
      ).toBeInTheDocument()
    })
    it('shows "No applications yet." when the list is empty', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], total: 0 }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('No applications yet.')).toBeInTheDocument()
    })
    it('shows an error message when the applications request fails', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
          })
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        })
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(
        await screen.findByText(
          "Couldn't load your applications. Try refreshing the page.",
        ),
      ).toBeInTheDocument()
    })
  })

  it("clicking an application row navigates to its detail page", async () => {
    const user = userEvent.setup()
    const items = [buildApplicationListItem({ id: 'abc123' })]
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/applications/stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items, total: items.length }),
      })
    })

    renderWithRouter(routeTree, queryClient, '/dashboard')

    await user.click(await screen.findByText('Senior Backend Engineer'))

    expect(
      await screen.findByText('Application Detail page'),
    ).toBeInTheDocument()
  })

  it('renders a "See more" link pointing to /applications', async () => {
    renderWithRouter(routeTree, queryClient, '/dashboard')

    const link = await screen.findByRole('link', { name: 'See more' })
    expect(link).toHaveAttribute('href', '/applications?page=1')
  })

  describe('inline status editing', () => {
    function mockApplicationsResponse(items: ApplicationListItem[]) {
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/applications/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
          })
        }
        if (url.includes('/applications/abc123/status')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items, total: items.length }),
        })
      })
    }

    it('shows a change-status icon next to the status text for an application with available transitions, and none for a terminal one', async () => {
      mockApplicationsResponse([
        buildApplicationListItem({
          availableTransitions: ['WAITING_FEEDBACK', 'OFFER', 'REJECTED'],
        }),
        buildApplicationListItem({
          id: '2',
          title: 'Frontend Developer',
          companyName: 'Globex',
          currentStatus: 'REJECTED',
          createdAt: '2026-02-01T10:00:00.000Z',
        }),
      ])

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('Applied')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Change status for Senior Backend Engineer',
        }),
      ).toBeInTheDocument()

      expect(screen.getByText('Rejected')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', {
          name: 'Change status for Frontend Developer',
        }),
      ).not.toBeInTheDocument()
    })

    it('clicking the change-status icon opens the Change Status dialog', async () => {
      const user = userEvent.setup()
      mockApplicationsResponse([
        buildApplicationListItem({
          availableTransitions: ['WAITING_FEEDBACK', 'OFFER', 'REJECTED'],
        }),
      ])

      renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(
        await screen.findByRole('button', {
          name: 'Change status for Senior Backend Engineer',
        }),
      )

      expect(
        await screen.findByRole('combobox', { name: 'Status' }),
      ).toBeInTheDocument()
    })

    it("navigates to the application's detail page after a successful status change", async () => {
      const user = userEvent.setup()
      mockApplicationsResponse([
        buildApplicationListItem({
          id: 'abc123',
          availableTransitions: ['WAITING_FEEDBACK', 'OFFER', 'REJECTED'],
        }),
      ])

      renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(
        await screen.findByRole('button', {
          name: 'Change status for Senior Backend Engineer',
        }),
      )
      await user.click(screen.getByRole('combobox', { name: 'Status' }))
      await user.click(await screen.findByRole('option', { name: 'Offer' }))
      await user.click(
        await screen.findByRole('button', { name: 'Update Status' }),
      )

      expect(
        await screen.findByText('Application Detail page'),
      ).toBeInTheDocument()
    })
  })
})
