import { QueryClient } from '@tanstack/react-query'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { DashboardPage } from '@/pages/dashboard-page'
import { formatRelativeTime } from '@/lib/relative-time'
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
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('DashboardPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  function mockDashboardFetch(
    overrides: {
      stats?: () => Promise<unknown>
      applications?: () => Promise<unknown>
      recentActivity?: () => Promise<unknown>
      overTime?: () => Promise<unknown>
      upcomingInterviews?: () => Promise<unknown>
    } = {},
  ) {
    const defaultStats = () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ total: 0, inProgress: 0, offers: 0, rejections: 0 }),
      })
    const defaultApplications = () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      })
    const defaultRecentActivity = () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    const defaultOverTime = () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    const defaultUpcomingInterviews = () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })

    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/applications/stats')) {
        return (overrides.stats ?? defaultStats)()
      }
      if (url.endsWith('/applications/recent-activity')) {
        return (overrides.recentActivity ?? defaultRecentActivity)()
      }
      if (url.endsWith('/applications/over-time')) {
        return (overrides.overTime ?? defaultOverTime)()
      }
      if (url.endsWith('/applications/interviews/upcoming')) {
        return (overrides.upcomingInterviews ?? defaultUpcomingInterviews)()
      }
      return (overrides.applications ?? defaultApplications)()
    })
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    mockDashboardFetch()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('summary cards', () => {
    it('renders loading skeletons while stats are pending', async () => {
      mockDashboardFetch({ stats: () => new Promise(() => {}) })

      const { container } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await screen.findByText('No applications yet.')
      expect(screen.queryByText('Total')).not.toBeInTheDocument()
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })

    it('renders the four summary cards with the loaded stats values', async () => {
      mockDashboardFetch({
        stats: () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          }),
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('Total')).toBeInTheDocument()
      expect(screen.getByTestId('stat-value-total')).toHaveTextContent('12')
      expect(
        screen.getByText('In Progress', { selector: 'p' }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('stat-value-inProgress')).toHaveTextContent('5')
      expect(screen.getByText('Offers', { selector: 'p' })).toBeInTheDocument()
      expect(screen.getByTestId('stat-value-offers')).toHaveTextContent('2')
      expect(
        screen.getByText('Rejections', { selector: 'p' }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('stat-value-rejections')).toHaveTextContent('3')
    })

    it('clicking a category card navigates to the Applications list filtered by that category', async () => {
      const user = userEvent.setup()
      mockDashboardFetch({
        stats: () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          }),
      })

      const { router } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(
        await screen.findByText('In Progress', { selector: 'p' }),
      )

      expect(await screen.findByText('Applications page')).toBeInTheDocument()
      expect(router.state.location.search).toMatchObject({
        page: 1,
        category: 'IN_PROGRESS',
      })
    })

    it('clicking the Total card navigates to the Applications list with no category filter', async () => {
      const user = userEvent.setup()
      mockDashboardFetch({
        stats: () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ total: 12, inProgress: 5, offers: 2, rejections: 3 }),
          }),
      })

      const { router } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await user.click(await screen.findByText('Total'))

      expect(await screen.findByText('Applications page')).toBeInTheDocument()
      expect(router.state.location.search).not.toHaveProperty('category')
    })

    it('shows an error message when the stats request fails', async () => {
      mockDashboardFetch({
        stats: () =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'Internal server error' }),
          }),
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(
        await screen.findByText("Couldn't load your stats. Try refreshing the page."),
      ).toBeInTheDocument()
    })
  })

  describe('latest applications list', () => {
    it('renders loading skeletons while pending', async () => {
      mockDashboardFetch({ applications: () => new Promise(() => {}) })

      const { container } = renderWithRouter(routeTree, queryClient, '/dashboard')

      await screen.findByText('Total')
      expect(screen.queryByText('No applications yet.')).not.toBeInTheDocument()
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })
    it("renders each application's title, company name, formatted status, and updated time", async () => {
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
      mockDashboardFetch({
        applications: () =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items, total: items.length }),
          }),
      })

      renderWithRouter(routeTree, queryClient, '/dashboard')

      const firstRow = (
        await screen.findByText('Senior Backend Engineer')
      ).closest('tr')!
      expect(within(firstRow).getByText('Acme Corp')).toBeInTheDocument()
      expect(
        within(firstRow).getByText('Interview Scheduled'),
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
          formatRelativeTime(new Date(items[1].updatedAt)),
        ),
      ).toBeInTheDocument()
    })
    it('shows "No applications yet." when the list is empty', async () => {
      mockDashboardFetch()

      renderWithRouter(routeTree, queryClient, '/dashboard')

      expect(await screen.findByText('No applications yet.')).toBeInTheDocument()
    })
    it('shows an error message when the applications request fails', async () => {
      mockDashboardFetch({
        applications: () =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: 'Internal server error' }),
          }),
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
    mockDashboardFetch({
      applications: () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items, total: items.length }),
        }),
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
})
