import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { RecentActivityFeed } from '@/components/recent-activity-feed'
import { formatStatus } from '@/lib/dashboard/applications-list'
import { formatRelativeTime } from '@/lib/relative-time'
import { fetchMock } from '@/test-setup'

const routeTree = buildRouteTree({
  '/': RecentActivityFeed,
  '/applications/$id': () => <div>Application Detail page</div>,
})

describe('RecentActivityFeed', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    )
  })

  it('renders loading skeletons while pending', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByRole('heading', { name: 'Recent Activity' })
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders each activity item's application title, company name, status, and relative time", async () => {
    const now = new Date()
    const item = {
      statusChangeId: '1',
      applicationId: 'abc123',
      applicationTitle: 'Senior Backend Engineer',
      companyName: 'Acme Corp',
      status: 'INTERVIEW_SCHEDULED' as const,
      eventDate: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    }

    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([item]),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText(item.applicationTitle),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent ===
            `${item.applicationTitle} at ${item.companyName} moved to ${formatStatus(item.status)}`,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(formatRelativeTime(new Date(item.eventDate))),
    ).toBeInTheDocument()
  })
  it('shows "No activity yet." when the list is empty', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(await screen.findByText('No activity yet.')).toBeInTheDocument()
  })
  it('shows an error message when the request fails', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText(
        "Couldn't load your recent activity. Try refreshing the page.",
      ),
    ).toBeInTheDocument()
  })
  it("clicking a row navigates to the application's detail page", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              statusChangeId: '1',
              applicationId: 'abc123',
              applicationTitle: 'Senior Backend Engineer',
              companyName: 'Acme Corp',
              status: 'INTERVIEW_SCHEDULED',
              eventDate: new Date().toISOString(),
            },
          ]),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    await user.click(await screen.findByText('Senior Backend Engineer'))

    expect(
      await screen.findByText('Application Detail page'),
    ).toBeInTheDocument()
  })
})
