import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { UpcomingInterviewsList } from '@/components/upcoming-interviews-list'
import { fetchMock } from '@/test-setup'

const routeTree = buildRouteTree({
  '/': UpcomingInterviewsList,
  '/applications/$id': () => <div>Application Detail page</div>,
})

describe('UpcomingInterviewsList', () => {
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

    await screen.findByRole('heading', { name: 'Interview Schedule' })
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders each interview's application title, company name, and formatted date/time", async () => {
    const interview = {
      statusChangeId: '1',
      applicationId: 'abc123',
      applicationTitle: 'Senior Backend Engineer',
      companyName: 'Acme Corp',
      eventDate: new Date(2026, 9, 15, 14, 0).toISOString(),
    }
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([interview]) }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText(interview.applicationTitle),
    ).toBeInTheDocument()
    expect(screen.getByText(interview.companyName)).toBeInTheDocument()
    expect(
      screen.getByText(
        new Date(interview.eventDate).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      ),
    ).toBeInTheDocument()
  })

  it('shows "No upcoming interviews scheduled." when the list is empty', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText('No upcoming interviews scheduled.'),
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

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText(
        "Couldn't load your upcoming interviews. Try refreshing the page.",
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
              eventDate: new Date(2026, 9, 15, 14, 0).toISOString(),
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
