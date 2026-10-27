import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { UpcomingInterviewsCalendar } from '@/components/upcoming-interviews-calendar'
import { getMonthGridDays } from '@/lib/dashboard/calendar-grid'
import { fetchMock } from '@/test-setup'

const TODAY = new Date(2026, 9, 27)

const routeTree = buildRouteTree({
  '/': () => <UpcomingInterviewsCalendar today={TODAY} />,
  '/applications/$id': () => <div>Application Detail page</div>,
})

describe('UpcomingInterviewsCalendar', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    )
  })

  async function openOctober15Popover() {
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

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')
    const eventCell = container.querySelector('[data-has-event="true"]')!
    await user.click(eventCell)

    return user
  }

  it('renders loading skeletons while pending', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByRole('heading', { name: 'Upcoming Interviews' })
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders the current month's name/year, day-of-week headers, and one cell per grid day", async () => {
    const expectedDays = getMonthGridDays(2026, 9, TODAY)

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')
    for (const name of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    expect(
      container.querySelectorAll('[data-slot="calendar-day"]'),
    ).toHaveLength(expectedDays.length)
  })

  it("marks today's cell and dims days outside the current month", async () => {
    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')
    const todayCells = container.querySelectorAll('[data-today="true"]')
    expect(todayCells).toHaveLength(1)
    expect(todayCells[0]).toHaveTextContent('27')

    expect(
      container.querySelectorAll('[data-current-month="false"]').length,
    ).toBeGreaterThan(0)
  })

  it('marks calendar days that have an interview with an event marker', async () => {
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

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')
    const eventCells = container.querySelectorAll('[data-has-event="true"]')
    expect(eventCells).toHaveLength(1)
    expect(eventCells[0]).toHaveTextContent('15')
  })

  it('navigates to the next and previous month', async () => {
    const user = userEvent.setup()

    renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')

    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(await screen.findByText('November 2026')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(await screen.findByText('October 2026')).toBeInTheDocument()
  })

  it('fetches interviews scoped to the currently displayed month, refetching on navigation', async () => {
    const user = userEvent.setup()

    renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('October 2026')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('year=2026&month=10'),
      expect.anything(),
    )

    await user.click(screen.getByRole('button', { name: 'Next month' }))
    await screen.findByText('November 2026')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('year=2026&month=11'),
      expect.anything(),
    )
  })

  it("clicking a day with an interview opens a popover listing that day's interview(s)", async () => {
    await openOctober15Popover()

    expect(await screen.findByText('Senior Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('clicking an interview in the popover navigates to its application detail page', async () => {
    const user = await openOctober15Popover()

    await user.click(await screen.findByText('Senior Backend Engineer'))

    expect(await screen.findByText('Application Detail page')).toBeInTheDocument()
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
})
