import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { DashboardPage } from '@/pages/dashboard-page'

const routeTree = buildRouteTree({
  '/dashboard': DashboardPage,
  '/applications': () => <div>Applications page</div>,
})

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
        {
          id: '1',
          title: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          currentStatus: 'INTERVIEW_SCHEDULED',
          createdAt: '2026-01-15T10:00:00.000Z',
        },
        {
          id: '2',
          title: 'Frontend Developer',
          companyName: 'Globex',
          currentStatus: 'APPLIED',
          createdAt: '2026-02-01T10:00:00.000Z',
        },
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

  it('renders a "See more" link pointing to /applications', async () => {
    renderWithRouter(routeTree, queryClient, '/dashboard')

    const link = await screen.findByRole('link', { name: 'See more' })
    expect(link).toHaveAttribute('href', '/applications?page=1')
  })
})
