import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { ApplicationDetailPage } from '@/pages/application-detail-page'
import type { ApplicationDetail } from '@/lib/applications/application-detail'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '/_authenticated',
})
const applicationDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/applications/$id',
  component: ApplicationDetailPage,
}).update({ id: '/applications_/$id' } as any)
const applicationsListRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/applications',
  component: () => <div>Applications List page</div>,
})
const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([
    applicationsListRoute,
    applicationDetailRoute,
  ]),
])

describe('ApplicationDetailPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  const baseDetailResponse: ApplicationDetail = {
    id: 'abc123',
    title: 'Senior Backend Engineer',
    companyName: 'Acme Corp',
    currentStatus: 'APPLIED',
    availableTransitions: [],
    statusHistory: [],
    createdAt: '2026-01-10T00:00:00.000Z',
  }

  function mockDetailResponse(overrides: Partial<ApplicationDetail> = {}) {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...baseDetailResponse, ...overrides }),
      }),
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renders loading skeletons while the detail query is pending', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithRouter(
      routeTree,
      queryClient,
      '/applications/abc123',
    )

    await waitFor(() => {
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })
  })

  it('renders the salary, a link to the job posting, and the description when present', async () => {
    mockDetailResponse({
      salary: 90000,
      externalUrl: 'https://example.com/jobs/123',
      description: 'A great role.\nRemote friendly.',
    })

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    expect(await screen.findByText('Salary: €90,000')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View job posting' }),
    ).toHaveAttribute('href', 'https://example.com/jobs/123')
    expect(
      screen.getByText('A great role. Remote friendly.'),
    ).toBeInTheDocument()
  })

  it('does not render salary, job posting link, or description when absent', async () => {
    mockDetailResponse()

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    await screen.findByText('Senior Backend Engineer')

    expect(screen.queryByText(/Salary:/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'View job posting' }),
    ).not.toBeInTheDocument()
  })

  it("renders the application's title, company name, and formatted current status", async () => {
    mockDetailResponse({ currentStatus: 'INTERVIEW_SCHEDULED' })

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    expect(
      await screen.findByText('Senior Backend Engineer'),
    ).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument()
  })

  it('renders the full status history timeline, one entry per status change with its formatted status and event date', async () => {
    mockDetailResponse({
      currentStatus: 'WAITING_FEEDBACK',
      statusHistory: [
        {
          id: 'sc1',
          status: 'APPLIED',
          eventDate: '2026-01-10T00:00:00.000Z',
          createdAt: '2026-01-10T00:00:00.000Z',
        },
        {
          id: 'sc2',
          status: 'WAITING_FEEDBACK',
          eventDate: '2026-01-20T00:00:00.000Z',
          createdAt: '2026-01-20T00:00:00.000Z',
        },
      ],
    })

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    const timeline = within(await screen.findByTestId('status-timeline'))

    expect(timeline.getByText('Applied')).toBeInTheDocument()
    expect(
      timeline.getByText(
        new Date('2026-01-10T00:00:00.000Z').toLocaleDateString(),
      ),
    ).toBeInTheDocument()
    expect(timeline.getByText('Waiting Feedback')).toBeInTheDocument()
    expect(
      timeline.getByText(
        new Date('2026-01-20T00:00:00.000Z').toLocaleDateString(),
      ),
    ).toBeInTheDocument()
  })

  it('shows interview category, contact, and notes on a status change entry when present', async () => {
    mockDetailResponse({
      currentStatus: 'INTERVIEW_SCHEDULED',
      statusHistory: [
        {
          id: 'sc1',
          status: 'INTERVIEW_SCHEDULED',
          eventDate: '2026-01-20T00:00:00.000Z',
          createdAt: '2026-01-20T00:00:00.000Z',
          interviewCategory: 'TECHNICAL',
          contact: { name: 'Jane Recruiter', email: 'jane@example.com' },
          notes: 'Went well,\nsecond round next week.',
        },
      ],
    })

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    const timeline = within(await screen.findByTestId('status-timeline'))

    expect(timeline.getByText(/Technical/)).toBeInTheDocument()
    expect(
      timeline.getByText('Jane Recruiter · jane@example.com'),
    ).toBeInTheDocument()
    expect(
      timeline.getByText('Went well, second round next week.'),
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

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    expect(
      await screen.findByText(
        "Couldn't load this application. Try refreshing the page.",
      ),
    ).toBeInTheDocument()
  })

  it('updates the current status and timeline after a successful status change, without a full page reload', async () => {
    const user = userEvent.setup()

    const appliedResponse: ApplicationDetail = {
      ...baseDetailResponse,
      availableTransitions: ['OFFER'],
      statusHistory: [
        {
          id: 'sc1',
          status: 'APPLIED',
          eventDate: '2026-01-10T00:00:00.000Z',
          createdAt: '2026-01-10T00:00:00.000Z',
        },
      ],
    }
    const offerResponse: ApplicationDetail = {
      ...appliedResponse,
      currentStatus: 'OFFER',
      availableTransitions: ['OFFER_ACCEPTED', 'OFFER_DECLINED'],
      statusHistory: [
        ...appliedResponse.statusHistory,
        {
          id: 'sc2',
          status: 'OFFER',
          eventDate: '2026-01-20T00:00:00.000Z',
          createdAt: '2026-01-20T00:00:00.000Z',
        },
      ],
    }

    let getDetailCallCount = 0
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith('/auth/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
        })
      }
      if (options?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }

      getDetailCallCount += 1
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            getDetailCallCount === 1 ? appliedResponse : offerResponse,
          ),
      })
    })

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    expect(
      within(await screen.findByRole('paragraph')).getByText('Applied'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))
    await user.click(screen.getByRole('button', { name: 'Update Status' }))

    await waitFor(() => {
      expect(
        within(screen.getByRole('paragraph')).getByText('Offer'),
      ).toBeInTheDocument()
    })
    const timeline = within(await screen.findByTestId('status-timeline'))
    expect(timeline.getByText('Offer')).toBeInTheDocument()
  })

  it('navigates to the Applications list when there is no previous page to go back to', async () => {
    const user = userEvent.setup()
    mockDetailResponse()

    renderWithRouter(routeTree, queryClient, '/applications/abc123')

    await user.click(await screen.findByRole('button', { name: 'Back' }))

    expect(
      await screen.findByText('Applications List page'),
    ).toBeInTheDocument()
  })

  it('returns to the previous page when one exists in history', async () => {
    const user = userEvent.setup()
    mockDetailResponse()

    renderWithRouter(routeTree, queryClient, [
      '/applications',
      '/applications/abc123',
    ])

    await user.click(await screen.findByRole('button', { name: 'Back' }))

    expect(
      await screen.findByText('Applications List page'),
    ).toBeInTheDocument()
  })
})
