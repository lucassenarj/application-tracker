import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { UpcomingInterviewsCalendar } from '@/components/upcoming-interviews-calendar'
import { getMonthGridDays } from '@/lib/dashboard/calendar-grid'

const TODAY = new Date(2026, 9, 27)

const routeTree = buildRouteTree({
  '/': () => <UpcomingInterviewsCalendar today={TODAY} />,
})

describe('UpcomingInterviewsCalendar', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

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
