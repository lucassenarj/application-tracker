import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { ApplicationsOverTimeChart } from '@/components/applications-over-time-chart'
import { getChartTicks } from '@/lib/dashboard/chart-ticks'
import { fetchMock } from '@/test-setup'

const routeTree = buildRouteTree({
  '/': ApplicationsOverTimeChart,
})

describe('ApplicationsOverTimeChart', () => {
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

    await screen.findByRole('heading', { name: 'Applications Over Time' })
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0)
  })

  it('renders a bar for each week with height proportional to count and a short-date label', async () => {
    const buckets = [
      { weekStart: '2026-10-05', count: 3 },
      { weekStart: '2026-10-12', count: 9 },
    ]
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(buckets) }),
    )

    const { container } = renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('Oct 5')
    expect(screen.getByText('Oct 12')).toBeInTheDocument()

    const bars = container.querySelectorAll('[data-slot="chart-bar"]')
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveStyle({ height: '30%' })
    expect(bars[1]).toHaveStyle({ height: '90%' })
  })

  it("renders Y-axis tick labels scaled to the data's max count", async () => {
    const buckets = [
      { weekStart: '2026-10-05', count: 3 },
      { weekStart: '2026-10-12', count: 9 },
    ]
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(buckets) }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    await screen.findByText('Oct 5')
    for (const tick of getChartTicks(9)) {
      expect(screen.getByText(String(tick))).toBeInTheDocument()
    }
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
        "Couldn't load your applications-over-time data. Try refreshing the page.",
      ),
    ).toBeInTheDocument()
  })
})
