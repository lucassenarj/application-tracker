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
const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([applicationDetailRoute]),
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
})
